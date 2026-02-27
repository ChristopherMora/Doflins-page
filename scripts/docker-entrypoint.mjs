import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

import mysql from "mysql2/promise";

const MIGRATIONS_TABLE = "__doflins_migrations";

function toBoolean(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function splitByStatementBreakpoint(sqlText) {
  return sqlText
    .split("--> statement-breakpoint")
    .map((part) => part.trim())
    .filter(Boolean);
}

async function waitForDb(databaseUrl, timeoutSeconds, intervalSeconds) {
  const started = Date.now();

  while (true) {
    try {
      const conn = await mysql.createConnection({ uri: databaseUrl, connectTimeout: 5000 });
      await conn.query("SELECT 1");
      await conn.end();
      console.log("[entrypoint] DB disponible.");
      return;
    } catch (error) {
      const elapsedSeconds = Math.floor((Date.now() - started) / 1000);
      if (elapsedSeconds >= timeoutSeconds) {
        throw new Error(`[entrypoint] Timeout esperando DB (${timeoutSeconds}s). Último error: ${error instanceof Error ? error.message : "unknown"}`);
      }

      console.log(`[entrypoint] Esperando DB... (${elapsedSeconds}s)`);
      await new Promise((resolve) => setTimeout(resolve, intervalSeconds * 1000));
    }
  }
}

async function ensureMigrationsTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`${MIGRATIONS_TABLE}\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tag VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function readAppliedTags(connection) {
  const [rows] = await connection.query(`SELECT tag FROM \`${MIGRATIONS_TABLE}\` ORDER BY id ASC`);
  return new Set(rows.map((row) => String(row.tag)));
}

async function readLegacyMigrationCount(connection) {
  try {
    const [rows] = await connection.query("SELECT COUNT(*) AS total FROM `__drizzle_migrations`");
    const firstRow = rows[0];
    const value = Number(firstRow?.total ?? 0);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

async function hydrateFromLegacyIfNeeded(connection, journalEntries) {
  const appliedTags = await readAppliedTags(connection);
  if (appliedTags.size > 0) {
    return appliedTags;
  }

  const legacyCount = await readLegacyMigrationCount(connection);
  if (legacyCount <= 0) {
    return appliedTags;
  }

  const assumedApplied = journalEntries.slice(0, Math.min(legacyCount, journalEntries.length));
  for (const entry of assumedApplied) {
    await connection.query(`INSERT IGNORE INTO \`${MIGRATIONS_TABLE}\` (tag) VALUES (?)`, [entry.tag]);
    appliedTags.add(entry.tag);
  }

  console.log(`[entrypoint] Detectadas ${legacyCount} migraciones legacy; sincronizadas ${assumedApplied.length} en ${MIGRATIONS_TABLE}.`);
  return appliedTags;
}

async function runMigrations(databaseUrl) {
  const journalPath = path.join(process.cwd(), "drizzle", "meta", "_journal.json");
  const journalRaw = await readFile(journalPath, "utf8");
  const journal = JSON.parse(journalRaw);
  const entries = Array.isArray(journal.entries) ? [...journal.entries].sort((a, b) => a.idx - b.idx) : [];

  if (entries.length === 0) {
    console.log("[entrypoint] No hay migraciones para ejecutar.");
    return;
  }

  const conn = await mysql.createConnection({
    uri: databaseUrl,
    multipleStatements: true,
    connectTimeout: 10000,
  });

  try {
    await ensureMigrationsTable(conn);
    const appliedTags = await hydrateFromLegacyIfNeeded(conn, entries);

    for (const entry of entries) {
      if (appliedTags.has(entry.tag)) {
        continue;
      }

      const sqlPath = path.join(process.cwd(), "drizzle", `${entry.tag}.sql`);
      const sqlRaw = await readFile(sqlPath, "utf8");
      const statements = splitByStatementBreakpoint(sqlRaw);

      console.log(`[entrypoint] Aplicando migración ${entry.tag} (${statements.length} bloque(s))...`);

      for (const statement of statements) {
        await conn.query(statement);
      }

      await conn.query(`INSERT INTO \`${MIGRATIONS_TABLE}\` (tag) VALUES (?)`, [entry.tag]);
      console.log(`[entrypoint] Migración ${entry.tag} aplicada.`);
    }

    console.log("[entrypoint] Migraciones completadas.");
  } finally {
    await conn.end();
  }
}

function runServer() {
  const child = spawn("node", ["server.js"], {
    stdio: "inherit",
    env: process.env,
  });

  const forwardSignal = (signal) => {
    if (!child.killed) {
      child.kill(signal);
    }
  };

  process.on("SIGINT", () => forwardSignal("SIGINT"));
  process.on("SIGTERM", () => forwardSignal("SIGTERM"));

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 1);
  });
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const waitDb = toBoolean(process.env.WAIT_FOR_DB, true);
  const runDbMigrations = toBoolean(process.env.RUN_DB_MIGRATIONS, true);
  const waitTimeout = toPositiveInt(process.env.DB_WAIT_TIMEOUT_SECONDS, 120);
  const waitInterval = toPositiveInt(process.env.DB_WAIT_INTERVAL_SECONDS, 3);

  if (databaseUrl && waitDb) {
    await waitForDb(databaseUrl, waitTimeout, waitInterval);
  }

  if (databaseUrl && runDbMigrations) {
    await runMigrations(databaseUrl);
  }

  runServer();
}

main().catch((error) => {
  console.error("[entrypoint] Error fatal:", error);
  process.exit(1);
});
