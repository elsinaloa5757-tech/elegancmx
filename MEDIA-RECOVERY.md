# Elegance MX — Recuperacion segura de medios ImageKit

## Fuente y alcance
Este proceso usa exclusivamente el inventario de /elegance/products/ de ImageKit mediante IMAGEKIT_PRIVATE_KEY almacenada en los secretos de GitHub Actions. Solo utiliza solicitudes de lectura. Los archivos multimedia NO se descargan, mueven, sobrescriben ni borran.

Un inventario de fotografias NO equivale al catalogo comercial de Floot. No contiene relacion foto-producto verificada ni nombre, marca, categoria, stock o precios de cada articulo. products.json debe permanecer vacio hasta recuperar y validar esos registros. Evitar crear productos de ejemplo vendibles.

## Archivos generados por el flujo de staging
- data/imagekit-media.json: entradas de ImageKit con URL original, ruta, ID, MIME, tamano y fecha.
- data/imagekit-report.json: conteos y estado real de validacion.
- data/potential-duplicates.json: candidatos que comparten tamano y MIME. No demuestra duplicacion binaria ni visual.

## Secuencia
1. Ejecutar Stage Elegance ImageKit Media en GitHub Actions. Se exporta de ImageKit y se comprueban las referencias.
2. Revisar la rama matrix/elegance-imagekit-restore, sin tocar ni publicar main.
3. Recuperar de la base original de Floot los registros de producto y su asociacion a fotos cuando el servicio permita exportarlos; o importar un respaldo confiable.
4. Conciliar las asociaciones de productos con fileId y url. Verificar informacion de cada producto, categorias y disponibilidad.
5. Actualizar products.json solo con articulos verificados. Probar buscador, filtros, carrito, favoritos y WhatsApp.
6. Fusionar cambios aprobados, comprobar pruebas y solo despues ejecutar manualmente el workflow existente de despliegue a Cloudflare Pages.

## Seguridad y limites
La existencia de imagenes no prueba autenticidad de marcas, precio, disponibilidad ni agrupacion de fotos en un producto. No se escriben tokens en el repositorio. No tocar GabyCases. Mantener assets/elegance-panther.png y el diseno original sin alteraciones. Los workflows de despliegue se mantienen manuales.
