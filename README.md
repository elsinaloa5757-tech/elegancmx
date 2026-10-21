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
- Automatización: `.github/workflows/catalog-ai.yml` consulta ImageKit de manera no destructiva dos veces por hora, analiza nuevas fotos y actualiza los borradores. Los cambios de datos publicados pueden activar el despliegue por las rutas configuradas en `deploy.yml`.
- El panel de administración permite subidas de hasta 250 fotos/videos por lote, compresión WebP de imágenes, comprobación de duplicados y modificaciones aprobadas.
- La prueba real de firma ImageKit guardada en Supabase Vault se completó satisfactoriamente (20 de octubre de 2026); creó y eliminó su archivo temporal. Las originales de ImageKit no se sustituyen ni destruyen.

## Administrador del propietario

El único panel vigente está integrado en la página principal. La ruta antigua `/studio.html` redirige a `/?administrador=1`. No utilizar ningún panel Studio separado para publicar mercancía.

La lista de autorización administrativa de Supabase ya contiene el correo propietario registrado. A la revisión del 20 de octubre aún no había una cuenta de autenticación **confirmada** que coincidiera con la lista. El propietario debe:

1. Abrir https://elegancemx-14c.pages.dev/?administrador=1.
2. Introducir **su correo ya autorizado** y una contraseña nueva de uso exclusivo.
3. Pulsar **Crear mi acceso seguro** y confirmar el enlace enviado al correo, si Supabase lo exige.
4. Volver a iniciar sesión y verificar el aviso **Acceso administrativo verificado** antes de subir fotos. No enviar contraseñas por chat.

El inicio de sesión y todas las operaciones administrativas están validadas por una Edge Function con verificación de usuario y lista de correos autorizados. La clave privada de ImageKit no debe enviarse al navegador.

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
