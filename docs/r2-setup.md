# Migración de Cloudinary a Cloudflare R2

## Configuración manual de Cloudflare

- [ ] **TODO:** En Cloudflare, abre **R2 Object Storage** y crea un bucket. El nombre sugerido es `clm-media`.
- [ ] **TODO:** En la configuración del bucket, agrega `media.celulareslibresmedellin.co` como dominio personalizado y espera a que quede activo. Usa `https://media.celulareslibresmedellin.co` como URL pública. El dominio personalizado permite cachear con Cloudflare y evita los límites de tasa del subdominio de desarrollo. Como alternativa temporal, habilita **Public Development URL** y usa la URL HTTPS `https://pub-<id>.r2.dev` que muestra Cloudflare.
- [ ] **TODO:** En **Settings → CORS Policy** del bucket, pega el contenido de [r2-cors.json](r2-cors.json). Permite PUT, GET y HEAD con los encabezados necesarios desde el dominio principal, el dominio con `www` y localhost. Consulta la [guía de CORS de Cloudflare](https://developers.cloudflare.com/r2/buckets/cors/).
- [ ] **TODO:** En **R2 Object Storage → Manage R2 API Tokens**, crea un token con permiso **Object Read & Write** limitado al bucket. Guarda el ID de cuenta, el Access Key ID y el Secret Access Key.

## Preparación local y corte en Vercel

- [ ] **TODO:** Configura `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` y `NEXT_PUBLIC_R2_PUBLIC_URL` en `.env.local`. Usa la URL pública HTTPS sin barra final. `R2_UPLOAD_FOLDER` es opcional y el valor predeterminado es `celulares_libres_medellin`. Solo afecta las nuevas subidas. Configura también la conexión a Postgres del entorno que quieras migrar.
- [ ] **TODO:** Ejecuta `pnpm migrate:r2` desde la raíz. Lee Postgres y escribe un plan JSON en `scripts/backups/`. Revisa las rutas, el logo y el número de productos afectados. Ante una colisión de claves, revisa las URLs de origen antes de aplicar.
- [ ] **TODO:** Despliega primero la versión compatible con ambos proveedores sin activar las variables de R2 en Vercel. Para un host distinto del recomendado o de `*.r2.dev`, inclúyelo en los patrones de imágenes de este primer despliegue. Así el storefront puede servir las URLs de R2 en cuanto cambie Postgres.
- [ ] **TODO:** Pausa las ediciones del catálogo durante el corte. Ejecuta `pnpm migrate:r2 -- --apply`. El script guarda un respaldo, copia las imágenes faltantes y verifica las URLs públicas antes de actualizar Postgres. Guarda el respaldo de este intento en un lugar seguro.
- [ ] **TODO:** Agrega las mismas variables de R2 en **Vercel → Settings → Environment Variables** para el entorno de destino. Despliega después de que el logo y las imágenes estén disponibles en R2. Vercel incorpora `NEXT_PUBLIC_R2_PUBLIC_URL` durante el build.
- [ ] **TODO:** Comprueba el logo, el catálogo y una subida desde el admin. Reanuda las ediciones cuando termines.

## Reversión durante los primeros 14 días

Conserva los assets y las variables de Cloudinary durante al menos 14 días después del corte en producción. No borres assets de Cloudinary manualmente. Evita retirar desde el admin imágenes de Cloudinary necesarias para la reversión, porque el admin sigue limpiando imágenes sin referencias.

Para revertir, pausa las ediciones y ejecuta `pnpm migrate:r2 -- --rollback <backup-json-path>` con el respaldo del intento de aplicación. Se restauran los arreglos originales de los productos afectados en una transacción. Si un producto cambió sus imágenes después de la migración, reconcilia ese cambio antes de reintentar. Las imágenes de R2 quedan en el bucket.

Para volver a Cloudinary también en el admin y para el logo, retira las variables de R2 del entorno activo en Vercel y vuelve a desplegar con las variables de Cloudinary. Mantén accesible el bucket mientras haya productos creados después del corte que apunten a R2. Revisa esos productos como parte de la reversión.
