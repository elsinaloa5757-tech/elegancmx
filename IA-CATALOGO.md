# Elegance MX: IA local gratuita para reconocimiento visual

## Arquitectura
- ImageKit: fuente multimedia original.
- GitHub Actions: inventario diario y ejecución del modelo abierto CLIP, sin API comercial ni exponer claves.
- Modelo: Xenova/clip-vit-base-patch32 mediante @huggingface/transformers. Ejecuta inferencia local en el runner de GitHub.
- data/ai-classifications.json: propuestas de categorías y marcas; **nunca datos comerciales verificados**.
- laboratorio-ia.html: muestra las sugerencias y permite aprobar manualmente nombres, categoría y agrupaciones; las aprobaciones se guardan en el navegador y se exportan mediante un JSON.
- products.json: permanece sin modificaciones hasta validar los artículos y cargar el JSON revisado. Cloudflare no se despliega automáticamente.

## Automatización
- GitHub Actions `Elegance MX — Clasificación IA sin API de pago`: ejecución programada cada seis horas. Se puede activar manualmente desde Actions.
- Procesa primero nuevas fotografías, con un lote limitado a 250 imágenes por ejecución programada. Mantiene las clasificaciones anteriores por ID.
- El primer arranque puede tardar más por la descarga de pesos del modelo. GitHub guarda una caché que reduce descargas.
- Los vídeos se conservan con su URL pero **no se clasifican aún por fotogramas**.
- Categorías y marcas son hipótesis del algoritmo. Los porcentajes son puntuaciones relativas entre clases candidatas, no garantías de verdad.
- La huella perceptual de 64 bits solo señala posibles imágenes duplicadas; nunca agrupa ni borra automáticamente.
- No se inventan precios, nombre exacto de modelo, tallas, stock ni autenticidad.

## Límites y seguridad
- Los runners estándar de GitHub Actions no facturan minutos para repositorios públicos, sujeto a normas y límites de GitHub. Los archivos públicos del repositorio son accesibles a terceros.
- Nunca introducir una clave privada de ImageKit en JavaScript del navegador.
- El laboratorio está alojado en una ruta pública aunque no aparezca en el menú: **no es un panel privado autenticado**, y las correcciones quedan locales. Antes de permitir escritura remota o publicación directa se necesitará autenticación y control de permisos.
- Cambiar la estructura de categorías de la tienda debe auditarse antes de pasar productos a producción.
- No modificar GabyCases. Conservar el diseño de la pantera.
