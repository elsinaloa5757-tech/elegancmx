import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseLegacyTsv,routeLegacyTitle,autoCategorize,TAXONOMY} from '../scripts/category-router.mjs';
test('read 80 historical examples and require non-commercial route',()=>{
 const history=parseLegacyTsv(fs.readFileSync('data/legacy-80.tsv','utf8'));
 assert.equal(history.length,80);
 assert.equal(routeLegacyTitle('Bolso Tabby blanco con monograma'),'Bolsas');
 assert.equal(routeLegacyTitle('Zapatos slingback de tacón'),'Calzado');
 assert.equal(routeLegacyTitle('Vestido mini sin mangas'),'Vestidos');
 assert.equal(routeLegacyTitle('Reloj cronógrafo dorado'),'Relojes');
 assert.equal(routeLegacyTitle('Formulario para publicar un artículo'),null);
 assert.equal(routeLegacyTitle('Artículo sin identificar'),null);
 assert.ok(TAXONOMY.includes('Tenis'));
});
test('auto filing accepts strong category suggestion but not a commercial product',()=>{
 const result=autoCategorize({ai:{categorySuggestion:'Tenis',categoryScore:.85,otherCategories:[{score:.85},{score:.10}]}});
 assert.equal(result.category,'Tenis');assert.equal(result.status,'auto_draft');
 assert.equal(autoCategorize({ai:{categorySuggestion:'Tenis',categoryScore:.65,otherCategories:[{score:.65},{score:.55}]}}).category,null);
 assert.equal(autoCategorize({ai:{categorySuggestion:'Tenis',categoryScore:.55,otherCategories:[{score:.55},{score:.10}]}}).category,null);
});
test('historical names override unsupported old category, but never auto confirm title',()=>{
 const result=autoCategorize({historical:{historicalName:'Monedero con solapa',historicalCategory:'Accesorios'}});
 assert.equal(result.category,'Bolsas');
 assert.equal(result.source,'legacy_name');
});
