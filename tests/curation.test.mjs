import test from 'node:test';
import assert from 'node:assert/strict';
import {validateBatch,applyBatch,PREFIX} from '../scripts/apply-curation-issue.mjs';
const ids=new Set(['6ad2fc54ead997d09a2d4ffe','6ad2fc54ead997d09a2d4f5c']);
const wrap=rows=>PREFIX+'\n'+JSON.stringify({version:1,changes:rows});
test('owner edit batches contain only safe categorization, grouping and visibility',()=>{
 const changes=validateBatch(wrap([{
  fileId:'6ad2fc54ead997d09a2d4ffe',category:'Tenis',name:'Tenis negros',brand:'Nike',
  groupId:'6ad2fc54ead997d09a2d4f5c',reviewed:true,hidden:true
 }]),ids);
 assert.equal(changes[0].category,'Tenis');
 const result=applyBatch({version:1,entries:{}},changes);
 assert.equal(result.entries['6ad2fc54ead997d09a2d4ffe'].groupId,'6ad2fc54ead997d09a2d4f5c');
 assert.equal(result.entries['6ad2fc54ead997d09a2d4ffe'].hidden,true);
 assert.ok(!('price' in result.entries['6ad2fc54ead997d09a2d4ffe']));
});
test('rejects fake photos, duplicate IDs and commercial fields',()=>{
 const id='6ad2fc54ead997d09a2d4ffe';
 assert.throws(()=>validateBatch(wrap([{fileId:'no-existing-photo',category:'Tenis'}]),ids));
 assert.throws(()=>validateBatch(wrap([{fileId:id,price:1000}]),ids),/no permitido/);
 assert.throws(()=>validateBatch(wrap([{fileId:id,stock:3}]),ids),/no permitido/);
 assert.throws(()=>validateBatch(wrap([{fileId:id,category:'Armas'}]),ids),/Categoría/);
 assert.throws(()=>validateBatch(wrap([{fileId:id,name:'<script>x</script>'}]),ids),/etiquetas/);
 assert.throws(()=>validateBatch(wrap([{fileId:id,category:'Tenis'},{fileId:id,reviewed:true}]),ids),/repetida/);
});
test('edits merge without clobbering unrelated photos; null clears a field',()=>{
 const id='6ad2fc54ead997d09a2d4ffe';
 const orig={version:1,entries:{[id]:{category:'Bolsas',name:'Anterior'},'6ad2fc54ead997d09a2d4f5c':{category:'Ropa'}}};
 const result=applyBatch(orig,validateBatch(wrap([{fileId:id,category:'Tenis',name:null}]),ids));
 assert.equal(result.entries[id].category,'Tenis');
 assert.ok(!('name' in result.entries[id]));
 assert.equal(result.entries['6ad2fc54ead997d09a2d4f5c'].category,'Ropa');
 assert.equal(orig.entries[id].category,'Bolsas');
});
