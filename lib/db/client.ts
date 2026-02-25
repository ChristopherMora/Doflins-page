import path from "node:path";

import { config as loadEnv } from "dotenv";
import mysql from "mysql2/promise";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";

import * as schema from "@/lib/db/schema";

export type Database = MySql2Database<typeof schema>;

const globalForDb = globalThis as typeof globalThis & {
  __doflinsPool?: mysql.Pool;
  __doflinsDb?: Database;
};

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv({ path: path.resolve(process.cwd(), ".env"), override: false });

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL no está configurado.");
  }

  return databaseUrl;
}

function createPool(): mysql.Pool {
  return mysql.createPool({
    uri: getDatabaseUrl(),
    connectionLimit: 10,
    namedPlaceholders: true,
    timezone: "Z",
  });
}

export function getDb(): Database {
  if (!globalForDb.__doflinsPool) {
    globalForDb.__doflinsPool = createPool();
  }

  if (!globalForDb.__doflinsDb) {
    globalForDb.__doflinsDb = drizzle(globalForDb.__doflinsPool, {
      schema,
      mode: "default",
    });
  }

  return globalForDb.__doflinsDb;
}

export async function pingDb(): Promise<void> {
  if (!globalForDb.__doflinsPool) {
    globalForDb.__doflinsPool = createPool();
  }

  await globalForDb.__doflinsPool.query("SELECT 1");
}
