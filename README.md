# Elegance MX

Tienda fotográfica Elegance MX — identidad visual con pantera original, negro y azul hielo.
Repositorio: `elsinaloa5757-tech/elegancmx`.

## Sitio publicado y pruebas

- Producción: https://elegancemx-14c.pages.dev/
- Publicación: GitHub Actions, `.github/workflows/deploy.yml`, ejecutada al cambiar los recursos de la tienda en `main` y también manualmente.
- Última publicación revisada (20 de octubre de 2026): ejecución exitosa de pruebas Playwright de escritorio y móvil, generación de paquete público y envío a Cloudflare Pages.
- La cuenta Cloudflare y el token viven en secretos de GitHub Actions; no introducir claves privadas en archivos públicos.
- El sitio se presenta **como catálogo fotográfico en recuperación**, no como inventario de productos comprobados.

## Inventario de ImageKit

- Archivo histórico base: **3,929 referencias**, desglosadas en **3,909 fotografías** y **20 videos**, en `data/imagekit-media.json`.
- Clasificación automática por modelo CLIP de ejecución local en GitHub Actions: a la revisión del 20 de octubre de 2026, **3,010 fotos con sugerencias de categoría** y **899 por clasificar con mayor seguridad** (ver `data/auto-categories-summary.json`).
- **0 productos comerciales confirmados.** `products.json` permanece vacío a propósito: una foto no confirma marca, autenticidad, existencias, precio ni producto único.
- Automatización: `.github/workflows/catalog-ai.yml` comprueba ImageKit de manera no destructiva aproximadamente cada 10 minutos y actualiza las categorías provisionales. Los cambios de datos publicados pueden activar el despliegue por las rutas configuradas en `deploy.yml`.
- El panel de administración permite subidas de hasta 250 fotos/videos por lote, compresión WebP de imágenes, comprobación de duplicados y modificaciones aprobadas.
- La prueba real de firma ImageKit guardada en Supabase Vault se completó satisfactoriamente (20 de octubre de 2026); creó y eliminó su archivo temporal. Las originales de ImageKit no se sustituyen ni destruyen.

## Administrador del propietario

El único panel vigente está integrado en la página principal. La ruta antigua `/studio.html` redirige a `/?administrador=1`. No utilizar ningún panel Studio separado para publicar mercancía.

La lista de autorización administrativa de Supabase ya contiene el correo propietario registrado. A partir del 21 de octubre de 2026, la cuenta autorizada **ya está confirmada y ha iniciado sesión**. Para acceder, abrir https://elegancemx-14c.pages.dev/?administrador=1 e iniciar sesión con la contraseña existente. **No** crear otra cuenta ni publicar ninguna credencial en el repositorio.

El inicio de sesión y todas las operaciones administrativas están validadas por una Edge Function con verificación de usuario y lista de correos autorizados. La clave privada de ImageKit no debe enviarse al navegador.

## Reconocimiento gratuito de fotografías y vinculación manual

- **Publicación inmediata:** la función protegida `elegance-admin` registra cada carga en Supabase e ImageKit. Su acción de consulta `visibility` publica solo los campos públicos de fotografías visibles; no devuelve SHA-256, credenciales, precios, existencias ni información del usuario.
- **Clasificación CLIP:** `.github/workflows/catalog-ai.yml` exporta ImageKit sin cambios destructivos, propone categorías y busca nuevas fotografías aproximadamente cada 10 minutos. GitHub Actions puede retrasar sus horarios. Después de guardar cambios, solicita el despliegue de Cloudflare y una ejecución de la IA visual.
- **Visión abierta SmolVLM:** `.github/workflows/vision-enrich.yml` procesa hasta 40 fotos por ejecución, programada dos veces cada hora y además invocable desde CLIP. Sus nombres en `data/vision-drafts.json` son borradores, no marcas/modelos/comercialización verificados.
- **Sugerencias de fotografías parecidas:** `scripts/build-visual-relations.mjs` compara huellas perceptuales de fotografías de la misma categoría con distancia Hamming 0-1. Emite `data/visual-relations.json`, un listado **no verificado** que no elimina ni fusiona nada. Fotos del mismo producto desde ángulos distintos pueden no detectarse.
- **Agrupación revisada por el propietario:** desde el administrador, en **Editar artículo → Revisar fotografías relacionadas**, se puede vincular una sugerencia tras comparar las imágenes; también se puede desagrupar. La acción autenticada `set-group` conserva una referencia `group_id` por fotografía en Supabase. La tienda solo reúne en una galería los vínculos ya aprobados, nunca los propuestos por la IA.
- **Auditoría:** `tests/visual-relations.test.mjs`, `tests/visual-photo-pipeline.spec.js`, `tests/admin-photo-groups.spec.js` y el flujo `verify-admin-cors.yml` prueban la separación entre propuestas públicas y modificaciones administrativas. Los datos reales de clasificación se consultan en `data/auto-categories-summary.json`.
- **Sin gastos de inferencia por fotografía:** los modelos abiertos se ejecutan en los runners de GitHub Actions, sujetos a límites, demoras y políticas de GitHub. No se han añadido APIs de inferencia de pago.

**Límite técnico:** modelo o marca exacta, autenticidad, talla y existencias siguen requiriendo evidencia verificable. Un nombre propuesto por la IA no convierte una foto en un artículo comercial confirmado.

## Canales sociales y pedidos

- Instagram enlazado a su perfil identificable: https://www.instagram.com/5_elegance_7/
- Facebook enlazado a la página conectada a la marca Elegance MX en Metricool: https://www.facebook.com/profile.php?id=1435660872952998\n- TikTok: la conexión de Metricool corresponde a `javiersanchez570`, pero todavía no se ha demostrado que sea la cuenta comercial de Elegance; el trébol mantiene un enlace general.\n- WhatsApp: número oficial de atención todavía sin verificar; el trébol mantiene un enlace general.
- No inventar un número de WhatsApp, precios ni métodos de cobro. Las consultas pueden copiar referencias de las fotos para preguntar por canales conocidos fuera del sitio.
- Evitar cualquier cambio en GabyCases u otros repositorios y aplicaciones.

## Referencia visual original

Proyecto anterior: Floot `fd70ecea-de01-42c7-a4cb-561e864b7aaa` (`elegance.mx`).
Componente: `components/ElegancePanel.tsx`.
Imagen original recuperada de la portada: `assets/elegance-panther.png`.

## Comprobaciones locales

```bash
npm install --no-package-lock
npm run check
node scripts/build-public.mjs
npx playwright install chromium
npm test
```

La publicación es intencionalmente estática y pública. Los borradores de IA y datos de medios no deben transformarse automáticamente en artículos de venta.
