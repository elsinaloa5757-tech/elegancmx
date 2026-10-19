# Elegance MX

Repositorio de desarrollo para la tienda Elegance MX.

## Estado
- La versión actualmente publicada en Cloudflare se mantiene separada de este repositorio hasta verificar la migración.
- La publicación mediante GitHub Actions está **solo bajo ejecución manual** (`workflow_dispatch`), no se activa con cada commit.
- El catálogo `products.json` está vacío a propósito: no se ha podido extraer ni validar el inventario real de Floot.
- El número oficial de WhatsApp todavía no está confirmado. No se generan pedidos ni se simulan pagos.
- No modificar GabyCases ni otros proyectos.

## Fuente visual verificada en Floot
Proyecto original: `fd70ecea-de01-42c7-a4cb-561e864b7aaa` (`elegance.mx`).
Componente: `components/ElegancePanel.tsx`.
Hero original: `/_cdn/static/4374c4b9-6708-4d2f-bda4-1aec271ae8b2.png`.
La imagen original del hero **sí se recuperó y se guardó** en `assets/elegance-panther.png` (imagen binaria original de Floot). Las fotografías de productos y el inventario aún no se han copiado y validado.

## Antes de publicar
1. Migrar y verificar los recursos visuales autorizados.
2. Recuperar el catálogo real y validar fotos, categorías, stock y precios (sin inventarlos).
3. Confirmar WhatsApp y el flujo de pedido.
4. Probar interfaz en móvil y escritorio, búsqueda, favoritos y carrito.
5. Guardar un token nuevo de Cloudflare como secreto `CLOUDFLARE_API_TOKEN`; revocar cualquier token expuesto.
6. Confirmar el nombre exacto del proyecto Pages y ejecutar manualmente `Deploy Elegance MX to Cloudflare Pages`.

**Nunca publicar este repositorio incompleto en producción.**
