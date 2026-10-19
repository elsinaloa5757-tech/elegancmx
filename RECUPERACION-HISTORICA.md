# Recuperación y clasificación automática — Elegance MX

## Evidencia recuperada
Se examinó el respaldo local `elegance-mx-catalogo-documentado-v3.zip`, fechado en octubre de 2026. Contiene 80 fichas documentadas de lotes 6-9 para preparación de pedidos WhatsApp. Los 80 enlaces de fotografía coinciden con el inventario actual de ImageKit (comparación de la ruta de URL, no de autenticidad de productos). Los nombres y descripciones vienen de ese respaldo; NO se verificaron marcas, autenticidad, precios ni existencias. Se recuperó un índice sin precios ni inventario con id histórico, UUID original, nombre documentado y categoría antigua en `data/legacy-80.tsv`.

También se examinó `elegance_v22_1_catalogo_marcas_modelos.zip`: trae código de reconocimiento y un SQLite con tabla recognition_samples **sin filas de aprendizaje**. No hay un modelo entrenado con esos datos para reusar. El código original de Floot se revisó de forma separada: el proceso de análisis de producto usa hasta seis fotografías, aplica la taxonomía activa y evita afirmar datos invisibles. Su motor remoto no se transfirió ni se pretende usar una API de pago.

## Nuevo flujo
1. Se obtiene el inventario ImageKit usando únicamente la clave de lectura de GitHub Actions.
2. La IA local CLIP propone categorías por imagen para fotografías nuevas.
3. La categorización automática cruza el UUID de ImageKit con las 80 etiquetas históricas y aplica reglas explícitas de tipos de artículo para corregir generalizaciones como "reloj" -> "Accesorios".
4. Para imágenes sin referencia histórica se asigna categoría provisional si la propuesta CLIP tiene puntuación relativa >=0.60 y margen sobre la segunda clase >=0.18. Estos umbrales NO son una exactitud estadística ni validan marcas.
5. Cualquier imagen incierta permanece en revisión manual; el sistema no elimina duplicados ni afirma que cada foto sea un producto separado.
6. Los nuevos índices se guardan en `data/auto-categories.json` y `data/auto-categories-summary.json` y aparecen en el laboratorio.

## Categorías finas
Se distinguen Tenis, Calzado, Bolsas, Playeras, Ropa, Vestidos, Lencería, Gorras, Pantalones, Buckets, Relojes, Lentes, Cinturones, Joyería, Fragancias, Accesorios y Memorias. Son categorías de trabajo. Los productos publicados siguen respetando el catálogo real de la tienda, que solo se rellenará con artículos confirmados.

## Seguridad
Los nombres del respaldo son **referencias históricas no verificadas**: se muestran para revisar, nunca se usan automáticamente como nombres comerciales aprobados. Los estados son auto_draft o manual_review. Nunca se asignan precios ni stock, ni se crea un producto vendible. Las etiquetas de marca del clasificador también quedan sin confirmar. No se modifica GabyCases ni el diseño original de la pantera. Cloudflare conserva su flujo de publicación manual.
