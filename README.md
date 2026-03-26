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
- Cloudinary

## Funcionalidades

- Home con categorías destacadas y productos `featured`
- Listado de productos con filtros por categoría, subcategoría y orden
- Detalle de producto con galería y selector de cantidad
- Carrito persistente en `localStorage`
- Checkout liviano por WhatsApp
- Páginas legales
- Panel admin con autenticación
- CRUD de productos, subcategorías y marcas
- Upload de imágenes a Cloudinary
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

CLOUDINARY_CLOUD_NAME=dwqyypb8q
# usar credenciales firmadas:
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
# o usar preset unsigned:
CLOUDINARY_UPLOAD_PRESET=

CLOUDINARY_UPLOAD_FOLDER=celulares_libres_medellin
```

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
pnpm db:push
pnpm db:generate
pnpm db:studio
pnpm db:migrate:json
```

## Desarrollo local

```bash
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Base de datos

El catálogo actual se sirve desde Postgres vía Drizzle.

Schema principal:

- `categories`
- `subcategories`
- `brands`
- `products`

Archivos clave:

- `db/schema.ts`
- `db/migrations/0000_init.sql`
- `lib/db/client.ts`
- `lib/server/catalog-admin.ts`

Notas:

- Los productos con `draft: true` no aparecen en la tienda pública.
- El borrado de productos, subcategorías y marcas es lógico (`soft delete`).
- El orden visible del catálogo depende de `sort_order`.

## Panel admin

Ruta:

- `/admin`

Capacidades:

- login con Supabase Auth
- crear, editar y eliminar productos
- crear, editar y eliminar subcategorías
- crear, editar y eliminar marcas
- marcar productos como destacados
- subir imágenes a Cloudinary
- editar `variants` y `attributes` como JSON

## Estructura principal

```text
app/
  admin/
  api/
  carrito/
  productos/
  components/
db/
lib/
scripts/
public/
```

Rutas clave:

- `app/page.tsx`
- `app/productos/page.tsx`
- `app/productos/[slug]/page.tsx`
- `app/carrito/page.tsx`
- `app/admin/page.tsx`
- `app/api/products/route.ts`
- `app/api/products/[slug]/route.ts`
- `app/api/admin/products/route.ts`

## Migración desde JSON

Existe un script legacy:

```bash
pnpm db:migrate:json
```

Ese script espera estos archivos:

- `data/products.generated.json`
- `data/subcategories.generated.json`
- `data/brands.generated.json`

En este checkout actual la carpeta `data/` no está incluida, así que ese flujo solo aplica si esos archivos se generan o restauran externamente.

## Verificación recomendada

```bash
pnpm lint
pnpm build
```

## Nota de prueba

Este cambio fue agregado como prueba para validar el flujo de ramas y PRs del proyecto.

Y validar manualmente:

- `/`
- `/productos`
- `/productos/[slug]`
- `/carrito`
- `/admin`
