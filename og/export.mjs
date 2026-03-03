import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = process.cwd();
const input = path.join(ROOT, "og", "template.html");
const outDir = path.join(ROOT, "public", "images");
const outFile = path.join(outDir, "og-image.jpg");

if (!fs.existsSync(input)) {
  console.error("❌ No existe:", input);
  process.exit(1);
}

// Asegurar que existe public/images/
fs.mkdirSync(outDir, { recursive: true });

console.log("🚀 Generando Open Graph image...");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ 
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2 // Calidad 2x (mejor para retina)
});

// Cargar HTML local
await page.goto("file://" + input, { waitUntil: "networkidle" });

// Screenshot JPG 1200x630
await page.screenshot({
  path: outFile,
  type: "jpeg",
  quality: 90, // Alta calidad
  fullPage: false,
});

await browser.close();

// Verificar tamaño
const stats = fs.statSync(outFile);
const sizeKB = (stats.size / 1024).toFixed(2);

console.log("✅ Listo:", outFile);
console.log("📦 Tamaño:", sizeKB, "KB");
console.log("📐 Dimensiones: 1200 × 630 px");

if (stats.size > 500 * 1024) {
  console.warn("⚠️  Advertencia: Imagen mayor a 500KB. Considera reducir quality en export.mjs");
}
