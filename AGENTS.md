# AGENTS.md

## Resumen

Ecommerce en Next.js para `Celulares Libres Medellin`.
El storefront público y el panel admin viven en la misma app.
El catálogo usa PostgreSQL con Drizzle y el acceso admin usa Supabase Auth.

## Stack

- Next.js 16 + React 19 + TypeScript
- App Router
- CSS Modules
- Zustand para carrito
- SWR para consumo cliente
- Drizzle ORM + `postgres`
- Supabase Auth
- Cloudinary para imágenes del admin

## Estructura importante

- `app/`: páginas, layout y API routes
- `app/admin/`: panel administrativo
- `app/api/`: endpoints públicos y admin
- `lib/domain/`: tipos del dominio
- `lib/services/`: hooks y fetch cliente
- `lib/store/`: estado local del carrito
- `lib/server/`: lógica de catálogo, marcas, subcategorías y auth admin
- `db/`: schema y migraciones
- `scripts/`: utilidades de base de datos y migración legacy

## Particularidades del app

- El catálogo público solo muestra productos no draft.
- El carrito es local y se persiste en `localStorage`.
- El cierre de compra actual se hace por WhatsApp.
- El panel admin permite gestionar productos, subcategorías, marcas e imágenes.
- Las imágenes del admin se suben a Cloudinary.
- El backoffice principal está concentrado en `app/admin/page.tsx`.

## Dominio

Categorías válidas:

- `technology`
- `clothing`
- `bikes`
- `sincategoria`

Entidades principales:

- `Product`
- `Subcategory`
- `Brand`
- `CartItem`
