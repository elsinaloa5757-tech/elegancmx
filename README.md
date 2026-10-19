# Elegance MX

Repositorio de desarrollo para la tienda Elegance MX.

## Estado
- La versión actualmente publicada en Cloudflare se mantiene separada de este repositorio hasta verificar la migración.
- La publicación mediante GitHub Actions está **solo bajo ejecución manual** (`workflow_dispatch`), no se activa con cada commit.
- El catálogo comercial `products.json` permanece vacío hasta validar artículos reales. Las 3,929 referencias de medios de ImageKit fueron recuperadas y están en `data/imagekit-media.json`.
- Ya funciona un clasificador CLIP gratuito en GitHub Actions para generar sugerencias de categorías/marcas y huellas perceptuales; la salida no es un catálogo comercial verificado. Consultar `data/ai-classifications.json` y `IA-CATALOGO.md`.
- El laboratorio de revisión está en `laboratorio-ia.html` (accesible en el sitio solo después de un despliegue). No tiene autenticación; las aprobaciones se guardan en el navegador y requieren exportación manual.
- El número oficial de WhatsApp todavía no está confirmado. No se generan pedidos ni se simulan pagos.
- No modificar GabyCases ni otros proyectos.

## Fuente visual verificada en Floot
Proyecto original: `fd70ecea-de01-42c7-a4cb-561e864b7aaa` (`elegance.mx`).
Componente: `components/ElegancePanel.tsx`.
Hero original: `/_cdn/static/4374c4b9-6708-4d2f-bda4-1aec271ae8b2.png`.
La imagen original del hero **sí se recuperó y se guardó** en `assets/elegance-panther.png` (imagen binaria original de Floot). El índice de fotografías y videos se recuperó de ImageKit sin mover los originales. Faltan nombres, relaciones fotografía-artículo, inventario y marcas verificadas.

## Antes de publicar
1. Migrar y verificar los recursos visuales autorizados.
2. Recuperar el catálogo real y validar fotos, categorías, stock y precios (sin inventarlos).
3. Confirmar WhatsApp y el flujo de pedido.
4. Probar interfaz en móvil y escritorio, búsqueda, favoritos y carrito.
5. Guardar un token nuevo de Cloudflare como secreto `CLOUDFLARE_API_TOKEN`; revocar cualquier token expuesto.
6. Confirmar el nombre exacto del proyecto Pages y ejecutar manualmente `Deploy Elegance MX to Cloudflare Pages`.

**Nunca publicar este repositorio incompleto en producción.**
