# Shopify Integration Checklist

Fecha de actualización: 2026-02-28

Leyenda:
- `[x]` Hecho
- `[~]` Parcial / adaptado
- `[ ]` Pendiente

## 1) Objetivo

- [x] Compra integrada en `doflins.dofer.mx` con catálogo y carrito desde la web.
- [x] Pago redirigido a Shopify Checkout por `checkoutUrl`.
- [x] Sin manejo de datos sensibles de tarjeta en servidor propio.

## 2) Alcance

### 2.1 Catálogo (Shopify -> web)

- [x] Listado por universo (`animals` / `multiverse`).
- [x] Muestra título, precio, imagen, descripción corta, disponibilidad.
- [x] Soporte de variantes y `variantId` para compra.
- [x] Soporte por `collections` (con fallback por query/tag/product_type).

### 2.2 Carrito (Shopify Cart API)

- [x] `cartCreate`.
- [x] Persistencia de `cartId` en cookie `HttpOnly`.
- [x] `cartLinesAdd`.
- [x] `cartLinesUpdate`.
- [x] `cartLinesRemove`.
- [x] Consulta de carrito con líneas, subtotal, total, impuestos estimados y moneda.

### 2.3 Checkout

- [x] Botón "Pagar" redirige a Shopify Checkout.
- [~] Post-pago con redirección de regreso: depende de configuración en Shopify (no automatizado aquí).

### 2.4 Promos / descuentos

- [x] Endpoint y UI para aplicar cupón (`cartDiscountCodesUpdate`).
- [x] Feedback de aplicación (aplicado/no aplicado).

### 2.5 Integración con "Scan"

- [ ] CTA en `scan/:code` ("Comprar otro pack"/"Comprar pack recomendado").
- [ ] Regla de recomendación por rareza (`alta -> pack 30`, `común -> pack 15`).

## 3) Fuera de alcance

- [x] No se implementó procesamiento de pagos directo (Stripe/PayPal server-side).
- [x] No se guardan tarjetas ni datos de pago.
- [x] No se construyó checkout embebido propio.

## 4) Requerimientos técnicos

### 4.1 Shopify

- [x] Variables de entorno agregadas en `.env.example`.
- [~] Falta cargar credenciales reales en entorno de despliegue.

### 4.2 Backend

- [~] Implementado en Next.js Route Handlers (equivalente funcional a backend dedicado), no en Go separado.
- [x] Endpoints REST:
  - [x] `GET /api/shop/products`
  - [x] `GET /api/shop/product/:handle`
  - [x] `POST /api/cart/create`
  - [x] `GET /api/cart`
  - [x] `POST /api/cart/lines/add`
  - [x] `POST /api/cart/lines/update`
  - [x] `POST /api/cart/lines/remove`
  - [x] `POST /api/cart/discount`
  - [x] `POST /api/cart/checkout`
- [x] `cartId` en cookie `HttpOnly`.
- [x] Solo Storefront API (sin Admin API).
- [x] Rate limiting básico por IP.
- [x] Logs básicos de errores de requests a Shopify.

### 4.3 Front

- [x] Catálogo por universo.
- [x] Tarjetas de producto con agregar al carrito.
- [x] Cart drawer (mini carrito).
- [~] CartPage dedicada: opcional, no implementada.
- [x] Estado de carrito desde `GET /api/cart` al cargar y actualización por acción.

## 5) Requerimientos funcionales

### Catálogo

- [x] Ver packs por universo.
- [x] Ver precio e imagen.
- [~] Abrir detalles de pack dedicados (`/product/:handle`) disponible por API, UI dedicada pendiente.

### Carrito

- [x] Agregar pack.
- [x] Aumentar/disminuir cantidad.
- [x] Eliminar item.
- [x] Ver subtotal y total estimado.

### Checkout

- [x] Clic en pagar redirige al checkout con carrito actual.
- [x] Carrito persiste al recargar.

### Descuentos

- [x] Ingresar cupón y ver resultado.

## 6) Reglas de negocio

- [x] Compra por `variantId`.
- [x] Botón deshabilitado si `sold out`.
- [x] Moneda según Shopify (`currencyCode`, ej. MXN).
- [x] Envío lo calcula Shopify en checkout.

## 7) No funcionales

- [x] Cache de catálogo (10 min backend).
- [x] Manejo de errores para no romper UI.
- [x] Logs básicos de errores.
- [ ] SLA real validado (`<800ms` catálogo, `<1s` carrito) pendiente medición.

## 8) Webhooks (Fase 2)

- [ ] `orders/paid` webhook con validación HMAC.
- [ ] Registro de compra y desbloqueo de recompensas.

## 9) QA (criterios de aceptación)

- [~] Implementados a nivel código, falta corrida QA manual end-to-end contra tienda real.

## 10) Entregables

- [~] Backend en Go: no aplica en este repo; se implementó equivalente en Next.js.
- [x] Front con catálogo + carrito + checkout.
- [x] `.env.example` actualizado.
- [x] README actualizado.

