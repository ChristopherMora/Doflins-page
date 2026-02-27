# Deploy en Dokploy (doflins.dofer.mx)

Guía rápida para desplegar directo desde Git en Dokploy.

## 1) DNS

Crea o valida el registro:

- Tipo: `A`
- Host: `doflins`
- Valor: `31.220.55.210`

Resultado esperado: `doflins.dofer.mx` apunta a tu servidor Dokploy.

## 2) Proyecto en Dokploy

En el dashboard (`http://31.220.55.210:3000/dashboard/projects`):

1. `New Project`
2. Conecta tu repositorio Git
3. Selecciona rama (por ejemplo `main`)

## 3) Método de despliegue

Tienes dos opciones:

- Opción A (`Dockerfile`): usa DB externa (recomendado si ya tienes MySQL administrado)
- Opción B (`docker-compose.yml`): levanta app + mysql en el mismo proyecto

## 4) Variables de entorno mínimas

Configura en Dokploy:

- `DATABASE_URL`
- `NEXT_PUBLIC_WOO_PRODUCT_URL=https://dofer.mx`
- `RUN_DB_MIGRATIONS=true`

Opcionales:

- `NEXT_PUBLIC_TIKTOK_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ADMIN_EMAILS`
- `ADMIN_FORM_TOKEN`
- `NEXT_PUBLIC_GTM_ID`
- `NEXT_PUBLIC_META_PIXEL_ID`
- `NEXT_PUBLIC_TIKTOK_PIXEL_ID`

## 5) Dominio y HTTPS

En Domains/Ingress del servicio:

- Domain: `doflins.dofer.mx`
- Internal Port: `3000`
- SSL: habilitar Let's Encrypt

## 6) Verificación post-deploy

- `https://doflins.dofer.mx/`
- `https://doflins.dofer.mx/reveal`
- `https://doflins.dofer.mx/api/health`

Si `/api/health` responde `db: down`, revisa `DATABASE_URL` y conectividad de MySQL.
