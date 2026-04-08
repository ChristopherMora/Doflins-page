/**
 * Script de migración: convierte todas las imágenes de doflins a WebP
 * y actualiza las URLs en la base de datos.
 *
 * Uso:
 *   npx tsx scripts/convert-images-to-webp.ts            # dry-run (solo muestra qué haría)
 *   npx tsx scripts/convert-images-to-webp.ts --execute   # ejecuta la conversión
 *
 * Requisitos:
 *   - DATABASE_URL en .env.local o .env
 *   - Las imágenes deben estar en public/uploads/doflins/
 */

import path from "node:path";
import { stat, unlink } from "node:fs/promises";

import { config as loadEnv } from "dotenv";
import { eq } from "drizzle-orm";
import sharp from "sharp";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv({ path: path.resolve(process.cwd(), ".env"), override: false });

import { getDb } from "../lib/db/client";
import { doflins } from "../lib/db/schema";

const CONVERTIBLE_EXTENSIONS = new Set(["png", "jpg", "jpeg"]);
const WEBP_QUALITY = 82; // good balance between size and quality

const dryRun = !process.argv.includes("--execute");

async function main() {
  if (dryRun) {
    console.log("🔍 DRY RUN — no se realizarán cambios. Usa --execute para aplicar.\n");
  } else {
    console.log("🚀 EJECUTANDO conversión a WebP...\n");
  }

  const db = getDb();

  // 1. Get all doflins with local image paths
  const rows = await db
    .select({
      id: doflins.id,
      nombre: doflins.nombre,
      imagenUrl: doflins.imagenUrl,
      siluetaUrl: doflins.siluetaUrl,
    })
    .from(doflins);

  console.log(`📦 Total doflins en DB: ${rows.length}`);

  let converted = 0;
  let skipped = 0;
  let errors = 0;
  let savedBytes = 0;

  for (const row of rows) {
    // Process both imagenUrl and siluetaUrl
    for (const field of ["imagenUrl", "siluetaUrl"] as const) {
      const urlPath = row[field];
      if (!urlPath || !urlPath.startsWith("/uploads/doflins/")) continue;

      const ext = path.extname(urlPath).replace(".", "").toLowerCase();
      if (!CONVERTIBLE_EXTENSIONS.has(ext)) {
        skipped++;
        continue;
      }

      const absolutePath = path.join(process.cwd(), "public", urlPath);
      const webpName = urlPath.replace(/\.(png|jpe?g)$/i, ".webp");
      const webpAbsolute = path.join(process.cwd(), "public", webpName);

      try {
        const originalStat = await stat(absolutePath).catch(() => null);
        if (!originalStat) {
          console.log(`  ⚠️  Archivo no encontrado: ${urlPath}`);
          skipped++;
          continue;
        }

        const originalSize = originalStat.size;

        if (dryRun) {
          console.log(`  📄 Convertiría: ${urlPath} → ${webpName} (${(originalSize / 1024).toFixed(1)}KB)`);
          converted++;
          continue;
        }

        // Convert to WebP with sharp
        await sharp(absolutePath)
          .webp({ quality: WEBP_QUALITY })
          .toFile(webpAbsolute);

        const newStat = await stat(webpAbsolute);
        const saved = originalSize - newStat.size;
        savedBytes += saved;

        // Update DB
        await db
          .update(doflins)
          .set({ [field === "imagenUrl" ? "imagenUrl" : "siluetaUrl"]: webpName })
          .where(eq(doflins.id, row.id));

        // Remove original file
        await unlink(absolutePath);

        const pct = originalSize > 0 ? ((saved / originalSize) * 100).toFixed(0) : 0;
        console.log(
          `  ✅ ${row.nombre} [${field}]: ${(originalSize / 1024).toFixed(1)}KB → ${(newStat.size / 1024).toFixed(1)}KB (${pct}% menos)`,
        );
        converted++;
      } catch (err) {
        console.error(`  ❌ Error en ${row.nombre} [${field}]:`, (err as Error).message);
        errors++;
      }
    }
  }

  console.log("\n" + "─".repeat(50));
  console.log(`✅ Convertidos: ${converted}`);
  console.log(`⏭️  Omitidos (ya webp/svg o no encontrado): ${skipped}`);
  if (!dryRun) {
    console.log(`💾 Espacio ahorrado: ${(savedBytes / 1024 / 1024).toFixed(2)}MB`);
  }
  if (errors > 0) {
    console.log(`❌ Errores: ${errors}`);
  }

  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
