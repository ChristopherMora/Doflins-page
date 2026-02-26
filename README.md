# DOFLINS Reveal V1

Experiencia de revelación de rareza para DOFLINS usando Next.js App Router, Tailwind, Framer Motion, Drizzle ORM y MySQL.

Colecciones activas en esta versión: `Animals` y `Multiverse`.

## Stack

- Next.js 16 + React 19 + TypeScript
- TailwindCSS v4 + componentes estilo shadcn/ui
- Framer Motion (animación reveal)
- Drizzle ORM + mysql2
- Zod (validación)
- GTM + dataLayer (`ViewContent`, `PurchaseIntent`)

## Rutas principales

- `GET /reveal?code=ABC123`: experiencia visual de reveal
- `GET /api/reveal?code=ABC123`: valida código y devuelve bolsa completa (`packSize` + `doflins[]`)
- `GET /api/collection`: catálogo de colección
- `GET /api/stats/remaining`: remanente por rareza
- `POST /api/events/purchase-intent`: logging de intención de compra
- `GET /admin/login`: login admin con Google (Supabase Auth)
- `GET /auth/callback`: callback OAuth de Supabase
- `GET /auth/user/callback`: callback OAuth de usuario para experiencia pública
- `GET /api/admin/doflins`: catálogo admin completo (requiere admin por Google o token opcional)
- `GET /api/progress`: progreso del usuario autenticado (`ownedIds`)
- `POST /api/progress`: guardar/quitar figura del progreso (`{ doflinId, owned }`)
- `POST /api/admin/doflins`: alta de Doflins (form-data)
- `PUT /api/admin/doflins?id=123`: edición completa de Doflin (form-data)
- `PATCH /api/admin/doflins?id=123`: activar/desactivar (`{ active: boolean }`)
- `DELETE /api/admin/doflins?id=123`: eliminación (si no está referenciado por códigos)
- `GET /api/health`: estado de app y conectividad con DB
- `GET /admin/doflins`: panel admin CRUD + carga masiva

## Configuración local

1. Instala dependencias:

```bash
npm install
```

2. Crea variables de entorno:

```bash
cp .env.example .env.local
```

Edita como mínimo:
- `DATABASE_URL` (MySQL real)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ADMIN_EMAILS` (lista blanca, separados por coma)

3. Opción rápida con Docker (recomendada):

```bash
npm run local:setup
```

Este script hace:
- levanta MySQL por `docker compose`
- espera disponibilidad del puerto
- aplica migraciones
- ejecuta seed (30 Doflins + códigos de bolsa para packs x1/x3/x5)

4. Opción manual:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

5. Levanta la app:

```bash
npm run dev
```

## Scripts útiles

- `npm run lint`
- `npm run test`
- `npm run db:studio`
- `npm run build`
- `npm run local:up`
- `npm run local:down`
- `npm run smoke` (requiere app corriendo en `localhost:3000`)

## Conversión 3MF a GLB

Si quieres automatizar modelos 3D para la web (`model-viewer`), usa:

```bash
python3 scripts/convert_3mf_to_glb.py ./mi_modelo.3mf ./public/models/doflins/mi_modelo.glb
```

Opciones útiles:

- `--engine auto|blender|assimp` (default: `auto`, intenta Blender y luego Assimp)
- `--inspect-only` (solo analiza si el 3MF trae datos de color/material)
- `--force` (sobrescribe salida)
- `--verbose` (muestra salida completa de la herramienta de conversión)

Nota:
- Si el 3MF fue generado por PrusaSlicer (`Slic3r_PE.*`), el script intenta mapear colores por extrusor a materiales GLB automáticamente.

## Política de códigos

- Códigos alfanuméricos de 6 a 12 caracteres.
- Primer escaneo activa el código (`usado=true`) y fija el resultado.
- Re-escaneos devuelven los mismos Doflins de esa bolsa e incrementan `scan_count`.
- Límite de API: 10 intentos/minuto por IP en `/api/reveal`.

## Deploy en servidor propio

1. Build standalone:

```bash
npm run build
```

2. Levanta con Node:

```bash
npm run start
```

3. Publica detrás de Nginx como reverse proxy hacia el puerto del proceso Node.
   Plantilla disponible en `scripts/nginx.doflins.conf`.

## Nota de assets

El seed crea 30 modelos con rutas:

- `/images/doflins/doflin-01.webp` ... `/images/doflins/doflin-30.webp`
- `/images/doflins/silueta-01.webp` ... `/images/doflins/silueta-30.webp`

Si no existen aún en `public/images/doflins`, la UI cae en placeholders automáticos.

## Auth admin con Supabase (Google)

1. En Supabase Dashboard entra a `Authentication > Providers > Google` y habilítalo.
2. Configura en Google Cloud el OAuth consent + credenciales web.
3. En Google Cloud agrega redirect URI:

```txt
https://TU-DOMINIO/auth/v1/callback
```

4. En Supabase `URL Configuration`, agrega:
- Site URL: `http://localhost:3000`
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/user/callback`

5. En `.env.local`, define:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
ADMIN_EMAILS=tu-correo-admin@dominio.com,otro-admin@dominio.com
```

6. Flujo final:
- Usuario entra a `/admin/doflins` y middleware redirige a `/admin/login`.
- Login con Google.
- Solo correos dentro de `ADMIN_EMAILS` pasan al panel.

## Alta manual de Doflins (admin)

1. Entra al panel:

```bash
http://localhost:3000/admin/doflins
```

2. Captura datos de figura (nombre, modelo base, variante, serie, rareza, probabilidad, número de colección) y sube imagen.

3. (Opcional) configura token de respaldo para scripts/manual:

```bash
ADMIN_FORM_TOKEN=tu_token_seguro
```

Notas:
- Subida principal por **archivo local** (se guarda en `public/uploads/doflins/`).
- También incluye **carga masiva** para crear varios Doflins de una vez.
- El panel permite **editar, activar/desactivar y eliminar**.
- Si defines `ADMIN_FORM_TOKEN`, el formulario muestra campo opcional para usarlo como alternativa al login.

## Efecto 3D

- La UI incluye efecto 3D visual (tilt + profundidad) en tarjetas de figuras.
- Para 3D real interactivo, la siguiente fase requiere modelos `.glb` por figura y visor WebGL.
