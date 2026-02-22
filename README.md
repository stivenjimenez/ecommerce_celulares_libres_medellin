## Celulares Libres Medellín - Ecommerce

Tienda ecommerce construida con Next.js (App Router), enfocada en catálogo de productos, detalle de producto y carrito persistente.

## Stack

- Next.js 16 + React 19 + TypeScript
- Zustand (estado del carrito con persistencia en `localStorage`)
- SWR (consumo de productos en frontend)
- CSS Modules
- Lucide React (íconos)

## Requisitos

- Node.js 20+
- pnpm

## Instalación y ejecución

```bash
pnpm install
pnpm dev
```

Abrir en navegador: [http://localhost:3000](http://localhost:3000)

## Scripts

```bash
pnpm dev               # entorno local
pnpm build             # build de producción
pnpm start             # servidor de producción
pnpm lint              # lint con ESLint
pnpm sync:wix-products # sincroniza productos desde la web origen
```

## Estructura principal

- app/
- lib/
- data/
- scripts/
- `app/page.tsx` (Home)
- `app/productos/page.tsx` (PLP - listado de productos)
- `app/productos/[slug]/page.tsx` (PDP - detalle de producto)
- `app/carrito/page.tsx` (carrito de compra)
- `app/api/products/route.ts` (API de catálogo)
- `app/api/products/[slug]/route.ts` (API de producto por slug)
- `lib/server/catalog.ts` (carga catálogo con fallback)
- `lib/store/cart-store.ts` (store global del carrito)
- `data/products.generated.json` (catálogo principal)
- `data/products.json` (fallback)
- `scripts/sync-wix-products.mjs` (crawler/sync de productos)

## Flujo de datos de productos

1. El backend carga primero `data/products.generated.json`.
2. Si no existe o está vacío, usa `data/products.json`.
3. El frontend consume el catálogo vía rutas API con SWR.

## Endpoints API

- `GET /api/products` -> lista completa de productos
- `GET /api/products/:slug` -> detalle por slug

## Funcionalidades implementadas

- Home con categorías destacadas
- Listado de productos con búsqueda
- Detalle de producto con selector de cantidad
- Carrito global con persistencia
- Páginas legales (`/privacidad`, `/terminos`)

## Notas

- El script `sync:wix-products` requiere acceso a red para descargar contenido y generar el catálogo.
- Las imágenes de productos se sirven desde `public/products`.

## Deploy

Se puede desplegar en cualquier entorno compatible con Next.js 16.

Flujo recomendado:

```bash
pnpm install
pnpm build
pnpm start
```
