# Elegance Studio — fase 1

## Alcance

Este módulo administra el **archivo fotográfico** de Elegance MX, no un inventario de venta. No requiere ni administra precios, tallas o existencias. Se usa el clasificador local gratuito CLIP en GitHub Actions para generar sugerencias de categorías; el administrador decide qué aprobar.

## Uso desde el celular

1. Abrir `/studio.html` desde la página de Elegance.
2. Filtrar fotos "Sin categoría", "Con sugerencia de IA" o "Posibles similares".
3. Pulsar **Editar / revisar** para asignar categoría, nombre descriptivo, marca *observada* (sin certificar autenticidad), marcar como revisada u ocultar una imagen.
4. Para agrupar fotos del mismo artículo, seleccionarlas y pulsar **Agrupar fotos**. Los grupos permiten mostrar varias fotografías juntas en la ficha de consulta, evitando repetir fotos en el catálogo.
5. Pulsar **Guardar en GitHub**. Con la cuenta **elsinaloa5757-tech** abierta, revisar los cambios prellenados en el formulario y pulsar **Submit new issue**. El flujo GitHub Actions `studio-sync.yml` valida que la solicitud la abrió el propietario, valida IDs y campos permitidos, confirma los datos en `data/catalog-curation.json` y solicita el despliegue de Cloudflare. No es necesario compartir contraseñas o tokens.
6. La edición se conserva temporalmente en el navegador hasta que sea publicada; se puede exportar una copia en JSON. Cuando el sitio recibe la publicación, los borradores publicados dejan de aparecer como pendientes.

**Importante**: visitar `/studio.html` no otorga permisos de administración en el servidor; todos pueden ver fotografías públicas o experimentar localmente, pero la publicación requiere la cuenta propietaria autenticada de GitHub. Nunca colocar tokens en JavaScript. Si se necesitan colaboradores o edición instantánea sin GitHub, es necesario un servicio de autenticación y almacenamiento adicional.

## Fuentes de datos

- `data/imagekit-media.json`: los medios reales de ImageKit, nunca se destruyen.
- `data/ai-classifications.json`: sugerencias no verificadas del modelo CLIP.
- `data/auto-categories.json`: asignaciones provisionales de categorías generadas en cada ejecución.
- `data/catalog-curation.json`: decisiones manuales de fotografía, agrupación y visibilidad, **no sobrescritas** por el clasificador.
- `products.json`: vacío hasta que se verifiquen artículos comerciales; no es modificado por esta etapa.

## Limitaciones conscientes

Una fotografía no equivale necesariamente a un artículo distinto. Los candidatos similares y las predicciones de marca no acreditan identidad ni autenticidad. Los grupos requieren confirmar visualmente que las fotos son del mismo artículo. Las actualizaciones GitHub → Cloudflare tardan lo que dure el flujo CI y la publicación; no aparecen instantáneamente al pulsar Guardar.

