# ✅ Checklist Completo SEO - DOFLINS

Este documento resume TODO lo que necesitas hacer para tener el SEO perfecto.

---

## 🎯 PARTE 1: Lo que YA está HECHO ✅

### ✅ Archivos de SEO Base
- [x] `app/sitemap.ts` - Sitemap XML configurado
- [x] `app/robots.ts` - Robots.txt configurado
- [x] Metadata completa en `app/layout.tsx`
- [x] Open Graph y Twitter Cards configurados
- [x] Structured Data (JSON-LD): Organization y WebSite

### ✅ Páginas con SEO Optimizado
- [x] Home (`app/page.tsx`) - Keywords y metadata
- [x] Catálogo (`app/reveal/page.tsx`) - Metadata específica
- [x] Colección (`app/coleccion/page.tsx`) - No indexada (correcto)
- [x] FAQ (`app/faq/page.tsx`) - Con structured data FAQPage
- [x] Acerca (`app/acerca/page.tsx`) - Historia y misión

### ✅ Optimizaciones Técnicas
- [x] Headers de seguridad en `next.config.ts`
- [x] Compresión HTML/CSS/JS
- [x] Imágenes AVIF/WebP automáticas
- [x] Keywords estratégicas en todas las páginas
- [x] Canonical URLs configuradas
- [x] Meta robots (index/noindex según página)

---

## 🔧 PARTE 2: Lo que DEBES hacer TÚ

### 📝 PRIORIDAD ALTA (Antes de lanzar)

#### 1. Actualizar Dominio en Archivos
**Ubicación:** 3 archivos
**Status:** ⚠️ PENDIENTE

Reemplaza `https://doflins.com` con TU dominio real:

- [ ] `app/sitemap.ts` línea 3
  ```typescript
  const baseUrl = 'https://TU-DOMINIO.com';
  ```

- [ ] `app/robots.ts` línea 3
  ```typescript
  const baseUrl = 'https://TU-DOMINIO.com';
  ```

- [ ] `app/layout.tsx` línea 24
  ```typescript
  const siteUrl = 'https://TU-DOMINIO.com';
  ```

**Cuándo:** Cuando compres/configures tu dominio

---

#### 2. Crear Imagen Open Graph
**Archivo:** `/public/images/og-image.jpg`
**Dimensiones:** 1200 x 630 píxeles
**Peso:** Menos de 300KB
**Status:** ⚠️ PENDIENTE

**Opciones:**

**Opción A: Usar Template HTML (Más fácil)**
- [ ] Abre `public/images/og-template.html` en Chrome
- [ ] Presiona F12 → Toggle Device Toolbar (o Ctrl+Shift+M)
- [ ] Ajusta tamaño a 1200 x 630
- [ ] Ctrl+Shift+P → "Capture screenshot"
- [ ] Guarda como `og-image.jpg` en `/public/images/`

**Opción B: Canva (Más personalizable)**
- [ ] Ve a canva.com
- [ ] Crea diseño 1200 x 630px
- [ ] Usa colores de DOFLINS (#f5f8e8, #4e6f2a)
- [ ] Agrega logo "DF" + texto "DOFLINS Colección Oficial"
- [ ] Descarga como JPG
- [ ] Guarda en `/public/images/og-image.jpg`

**Opción C: Figma/Photoshop**
- [ ] Diseño profesional 1200 x 630px
- [ ] Exporta como JPG (calidad 85%)
- [ ] Guarda en `/public/images/og-image.jpg`

**Verificación:**
- [ ] Archivo existe en `/public/images/og-image.jpg`
- [ ] Peso < 300KB
- [ ] Dimensiones exactas: 1200 x 630
- [ ] Prueba en https://www.opengraph.xyz/

---

#### 3. Google Search Console Setup
**Status:** ⚠️ PENDIENTE
**Tiempo estimado:** 20 minutos
**Guía completa:** Lee `GUIA_GOOGLE_SEARCH_CONSOLE.md`

**Pasos:**

- [ ] Ir a https://search.google.com/search-console
- [ ] Iniciar sesión con cuenta Google
- [ ] Agregar tu propiedad (dominio o URL)
- [ ] Elegir método de verificación: **Etiqueta HTML**
- [ ] Copiar código de verificación de Google
- [ ] Abrir `app/layout.tsx` línea ~86
- [ ] Agregar código en `verification.google`:
  ```typescript
  verification: {
    google: 'TU-CODIGO-AQUI',
  },
  ```
- [ ] Commit y push:
  ```bash
  git add app/layout.tsx
  git commit -m "feat: agregar verificación de Google Search Console"
  git push origin master
  ```
- [ ] Esperar 2-3 minutos (despliegue)
- [ ] Regresar a Search Console → Clic en "Verificar"
- [ ] ✅ Ver mensaje: "Se verificó la propiedad"

**Después de verificar:**
- [ ] Ir a "Sitemaps"
- [ ] Agregar sitemap: `sitemap.xml`
- [ ] Clic en "Enviar"
- [ ] ✅ Ver status "Correcto"

**Indexación manual (opcional pero recomendado):**
- [ ] Usar "Inspeccionar URL" en barra superior
- [ ] Solicitar indexación de:
  - `https://tudominio.com`
  - `https://tudominio.com/reveal`
  - `https://tudominio.com/faq`
  - `https://tudominio.com/acerca`

**Resultado esperado:**
- [ ] Datos empiezan a aparecer en 48-72 horas
- [ ] Páginas indexadas en Google en 2-7 días

---

### 📝 PRIORIDAD MEDIA (Primera semana)

#### 4. Logo/Favicon
**Status:** ⚠️ REVISAR

- [ ] Verificar que existe `/public/images/logo.png`
- [ ] Si no existe, crear logo:
  - Tamaño recomendado: 512 x 512px
  - Fondo transparente PNG
  - Logo DOFLINS o ícono "DF"
- [ ] Verificar favicon en `app/manifest.ts`

---

#### 5. Redes Sociales (Opcional)
**Ubicación:** `app/layout.tsx` líneas 97-101
**Status:** 🔜 OPCIONAL

Si tienes redes sociales de DOFLINS, agrégalas:

```typescript
sameAs: [
  "https://www.facebook.com/doflins",
  "https://www.instagram.com/doflins",
  "https://www.tiktok.com/@doflins",
  "https://www.twitter.com/doflins",
],
```

**Beneficio:** Google asocia tu marca con tus perfiles sociales

---

#### 6. Analytics Avanzado
**Status:** ⚠️ REVISAR

Verificar que Google Tag Manager está configurado:
- [ ] Revisa `components/analytics/gtm.tsx`
- [ ] Confirma que GTM_ID está en variables de entorno
- [ ] Si no tienes GTM, crear cuenta en https://tagmanager.google.com
- [ ] Copiar ID (GTM-XXXXXXX)
- [ ] Agregar a `.env.local`:
  ```
  NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
  ```

---

### 📝 PRIORIDAD BAJA (Primer mes)

#### 7. Contenido Adicional para SEO

**Blog (Muy recomendado para tráfico orgánico):**
- [ ] Crear `app/blog/page.tsx`
- [ ] Escribir 5-10 artículos:
  - "Guía completa de rareza en DOFLINS"
  - "Cómo verificar autenticidad con códigos QR"
  - "Diferencias entre universos Animals y Multiverse"
  - "Tips para coleccionistas principiantes"
  - "Historia detrás de DOFLINS"
- [ ] Agregar al sitemap
- [ ] Agregar link en navegación

**Footer con Links Importantes:**
- [ ] Crear footer con:
  - Link a FAQ
  - Link a Acerca
  - Link a Política de Privacidad
  - Link a Términos y Condiciones
  - Link a Política de Envíos
  - Redes sociales

---

#### 8. Páginas Legales (OBLIGATORIAS para tienda)

**Status:** ⚠️ PENDIENTE PERO IMPORTANTE

- [ ] Crear `app/privacidad/page.tsx` - Política de privacidad
- [ ] Crear `app/terminos/page.tsx` - Términos y condiciones
- [ ] Crear `app/envios/page.tsx` - Política de envíos
- [ ] Crear `app/devoluciones/page.tsx` - Política de devoluciones
- [ ] Agregar links en footer
- [ ] Actualizar sitemap

**Nota:** Puedes usar generadores online de políticas legales

---

#### 9. Schema.org para Productos (Shopify)

**Status:** 🔜 FUTURO

Cuando tengas más productos en Shopify:
- [ ] Agregar structured data "Product" en páginas de producto
- [ ] Incluir: precio, disponibilidad, calificaciones
- [ ] Habilita rich snippets en Google Shopping

---

## 📊 VERIFICACIONES Post-Lanzamiento

### Semana 1:
- [ ] Verificar que sitemap se genera: `https://tudominio.com/sitemap.xml`
- [ ] Verificar robots.txt: `https://tudominio.com/robots.txt`
- [ ] Probar Open Graph: Compartir en WhatsApp/Facebook
- [ ] Google Search Console muestra páginas indexadas
- [ ] Primeras impresiones aparecen en Analytics

### Semana 2-4:
- [ ] Revisar Search Console semanalmente
- [ ] Identificar palabras clave que generan tráfico
- [ ] Optimizar páginas con bajo CTR
- [ ] Crear contenido para keywords con impresiones pero sin clics

### Mes 2-3:
- [ ] Análisis de competencia (qué keywords usan)
- [ ] Crear backlinks (menciones en otros sitios)
- [ ] Compartir en redes sociales regularmente
- [ ] Escribir contenido de blog mensualmente

### Mes 6:
- [ ] Evaluar posicionamiento para "doflins" (objetivo: top 3)
- [ ] Evaluar tráfico orgánico (objetivo: 100+ visitantes/día)
- [ ] Revisar qué páginas generan más conversiones
- [ ] Ajustar estrategia según datos

---

## 🎯 KPIs (Indicadores de Éxito)

### Inmediato (Primera semana):
- ✅ 8 páginas indexadas en Google
- ✅ Sitemap enviado sin errores
- ✅ Open Graph funciona al compartir

### Corto Plazo (Mes 1):
- 🎯 50-100 impresiones/día
- 🎯 5-15 clics/día desde Google
- 🎯 Top 20 para "doflins"
- 🎯 CTR: 5-10%

### Mediano Plazo (Mes 3):
- 🎯 500+ impresiones/día
- 🎯 50+ clics/día
- 🎯 Top 10 para "doflins"
- 🎯 Top 20 para "colección figuras"
- 🎯 CTR: 8-12%

### Largo Plazo (Mes 6):
- 🚀 2,000+ impresiones/día
- 🚀 200+ clics/día
- 🚀 Top 3 para "doflins"
- 🚀 Top 10 para "figuras coleccionables méxico"
- 🚀 CTR: 10-15%

---

## 🚀 Resumen: ¿Qué hacer AHORA?

### Hoy (5 min):
1. [ ] Lee esta guía completa
2. [ ] Revisa `GUIA_GOOGLE_SEARCH_CONSOLE.md`

### Esta semana (30 min):
1. [ ] Crea imagen Open Graph
2. [ ] Configura Google Search Console
3. [ ] Actualiza dominios en archivos (cuando tengas dominio)

### Este mes:
1. [ ] Crea páginas legales (privacidad, términos)
2. [ ] Agrega footer con links
3. [ ] Escribe 1-2 artículos de blog (si decides crear blog)

### Mantenimiento continuo:
- Revisar Search Console semanalmente
- Crear contenido mensualmente
- Optimizar según datos

---

**🎉 ¡Tu sitio está 90% optimizado! Solo quedan detalles de personalización.**

**Estado actual:** ⚠️ **LISTO TÉCNICAMENTE** - Solo falta Open Graph + Google Search Console

**Archivos de ayuda:**
- `public/images/og-template.html` - Template para crear imagen
- `GUIA_GOOGLE_SEARCH_CONSOLE.md` - Guía paso a paso de Search Console
- Este archivo - Checklist completo

**¿Dudas?** Revisa las guías o pregúntame.
