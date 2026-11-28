# Celulares Libres Medellin

Tienda ecommerce construida con Next.js App Router. Incluye storefront público, carrito persistente y panel admin para gestionar productos, subcategorías, marcas e imágenes.

## Stack

- Next.js 16
- React 19
- TypeScript
- CSS Modules
- Zustand
- SWR
- Drizzle ORM
- Postgres
- Supabase Auth
- Supabase Storage

## Funcionalidades

- Home con categorías destacadas y productos `featured`
- Listado de productos con filtros por categoría, subcategoría y orden
- Detalle de producto con galería y selector de cantidad
- Carrito persistente en `localStorage`
- Checkout liviano por WhatsApp
- Páginas legales
- Panel admin con autenticación
- CRUD de productos, subcategorías y marcas
- Subida de imágenes WebP a Supabase Storage
- Reordenamiento de imágenes en el admin

## Requisitos

- Node.js 20+
- pnpm
- Base de datos Postgres accesible
- Proyecto Supabase configurado para auth

## Instalación

```bash
pnpm install
```

## Variables de entorno

Crear `.env.local` con:

```env
DATABASE_URL=
# o SUPABASE_DB_URL=
# o POSTGRES_URL=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Solo en el servidor. Nunca usar el prefijo NEXT_PUBLIC.
SUPABASE_STORAGE_SECRET_KEY=
# IDs de usuarios de Supabase Auth autorizados a gestionar fotos, separados por comas.
PRODUCT_IMAGE_ADMIN_IDS=
# Después de migrar las fotos existentes, desactiva los orígenes de Cloudinary.
ALLOW_LEGACY_CLOUDINARY_IMAGES=true
```

## Migrar las fotos existentes

Las imágenes del catálogo se sirven desde un bucket público llamado
`product-images`. Mantén las escrituras directas del bucket reservadas al
servidor. El panel convierte las fotos nuevas a WebP, con un máximo de 1600
píxeles en el lado más largo y 1 MiB por archivo.

```bash
node scripts/migrate-product-images.mjs prepare /ruta/privada/clm-images
node scripts/migrate-product-images.mjs upload /ruta/privada/clm-images
node scripts/migrate-product-images.mjs switch /ruta/privada/clm-images
```

`prepare` descarga las fotos, las convierte a WebP y genera un manifiesto con
las URLs de origen y el tamaño. `upload` crea el bucket si hace falta, copia los
archivos deduplicados y verifica sus hashes desde las URLs públicas.

Ejecuta `switch` después de desplegar y verificar que la tienda pueda mostrar
imágenes de ambos orígenes. La operación verifica las copias otra vez antes de
actualizar las URLs del catálogo en una transacción. Conserva el manifiesto y
el respaldo del catálogo hasta terminar las pruebas.
