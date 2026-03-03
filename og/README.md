# 🎨 Generador Open Graph para DOFLINS

Este directorio genera automáticamente la imagen Open Graph (`og-image.jpg`) que aparece cuando compartes tu sitio en redes sociales.

## 🚀 Uso Rápido

### 1. Instalar dependencias (solo primera vez)
```bash
cd /home/mora/Doflins-page
npm install
npx playwright install chromium --with-deps
```

### 2. Generar imagen
```bash
npm run export:og
```

**Resultado:** Se crea `/public/images/og-image.jpg` (1200×630 px) ✅

---

## ✏️ Personalizar Contenido

Abre `og/template.html` y edita estos textos:

### Marca (arriba)
```html
<div class="name">DOFLINS</div>
<div class="tag">Colección Oficial • Animals + Multiverse</div>
```

### Badge superior
```html
<span id="kicker">COLECCIÓN EN LÍNEA</span>
```

### Título principal
```html
<h1 id="title">Colecciona.<br>Explora.<br>Completa.</h1>
```

### Subtítulo
```html
<div class="sub" id="subtitle">
  Figuras con rareza oficial verificada. Dos universos, códigos QR únicos.
</div>
```

### Chips (abajo)
```html
<div class="chip" id="chip1">🔥 Rareza Verificada</div>
<div class="chip" id="chip2">✨ Códigos QR</div>
<div class="chip" id="chip3">🇲🇽 Hecho en México</div>
```

---

## 🎨 Personalizar Colores

En `og/template.html`, busca la sección `<style>` y ajusta:

### Colores principales (ya configurados para DOFLINS)
- **Verde principal:** `#4e6f2a`
- **Verde oscuro:** `#425f2d`
- **Texto oscuro:** `#1f2a1a`
- **Texto claro:** `#3d5230`
- **Fondo:** Gradiente `#f5f8e8` → `#e8f1d2` → `#d5e5b2`

Si quieres cambiarlos, busca estos valores en el CSS.

---

## 📱 Agregar QR Real (Opcional)

Si tienes un código QR para escanear:

1. Guarda la imagen como `og/qr.png`

2. En `og/template.html`, reemplaza el bloque `#qr`:
```html
<div class="qr">
  <img src="./qr.png" style="width:100%;height:100%;object-fit:contain;border-radius:12px;" />
</div>
```

3. Vuelve a exportar: `npm run export:og`

---

## 🔍 Verificar Resultado

### Ver localmente
Abre `og/template.html` en tu navegador para preview

### Verificar después de subir
1. Sube la imagen a producción (en `/public/images/og-image.jpg`)
2. Prueba en: https://www.opengraph.xyz/
3. Pega tu URL: `https://tudominio.com`
4. Verás cómo se ve en Facebook, Twitter, WhatsApp, etc.

---

## 📊 Especificaciones

- **Dimensiones:** 1200 × 630 px (exacto)
- **Formato:** JPG
- **Calidad:** 90%
- **Peso ideal:** < 300 KB
- **Usado en:** Facebook, Twitter, WhatsApp, LinkedIn, Discord, Slack

---

## 🛠️ Troubleshooting

### Error: "playwright not found"
```bash
npx playwright install chromium --with-deps
```

### Imagen muy pesada (> 500 KB)
En `og/export.mjs`, cambia:
```javascript
quality: 90, // Reduce a 85 o 80
```

### Colores se ven diferentes
Playwright usa perfil de color sRGB. Verifica en navegador primero.

### No se ve en redes sociales después de subir
- Borra caché de Facebook: https://developers.facebook.com/tools/debug/
- Borra caché de Twitter: https://cards-dev.twitter.com/validator
- Espera 1-2 horas para que se actualice el cache

---

## 🎯 Variaciones

Puedes crear múltiples versiones para diferentes páginas:

### Para página de catálogo
```html
<h1>Catálogo Oficial<br>Animals + Multiverse</h1>
```
Exporta como `og-catalog.jpg`

### Para tienda
```html
<h1>Compra Packs<br>de DOFLINS</h1>
```
Exporta como `og-shop.jpg`

Luego en cada página usa metadata específica:
```typescript
openGraph: {
  images: [`${siteUrl}/images/og-catalog.jpg`],
}
```

---

## ✅ Checklist Final

- [ ] Instalar dependencias (`npm install`)
- [ ] Instalar Playwright Chromium
- [ ] Personalizar textos en `template.html`
- [ ] Ejecutar `npm run export:og`
- [ ] Verificar que existe `/public/images/og-image.jpg`
- [ ] Verificar dimensiones (1200×630) y peso (< 300KB)
- [ ] Subir a producción
- [ ] Probar compartir en WhatsApp/Facebook
- [ ] Verificar en opengraph.xyz

---

**¿Todo listo?** Tu imagen Open Graph profesional está lista para compartir 🚀
