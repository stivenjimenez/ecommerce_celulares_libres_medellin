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
