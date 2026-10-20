import test from 'node:test';
import assert from 'node:assert/strict';
import {CATEGORY_LABELS,MODEL,chooseCategory,chooseBrand,dhash,hashDistance,duplicateCandidates} from '../scripts/ai-utils.mjs';
test('categorias son etiquetas de sugerencia, no marcas verificadas',()=>{
  assert.ok(MODEL.includes('clip'));
  const output=chooseCategory([{label:CATEGORY_LABELS[0][1],score:.84},{label:CATEGORY_LABELS[1][1],score:.16}]);
  assert.equal(output.category,'Tenis');assert.equal(output.alternatives.length,2);
  assert.equal(chooseCategory([{label:CATEGORY_LABELS.at(-1)[1],score:1}]).category,null);
  assert.equal(chooseBrand([{label:'a product visibly displaying the Nike brand logo',score:.52}]).brand,null);
});
test('huella perceptual solo emite candidatos, sin borrar multimedia',()=>{
  const sample=new Uint8Array(72);for(let i=0;i<72;i++)sample[i]=i%9;
  const hash=dhash(sample);assert.match(hash,/^[\da-f]{16}$/);
  assert.equal(hashDistance(hash,hash),0);
  assert.deepEqual(duplicateCandidates({fileId:'a',visualHash:hash},[{fileId:'b',visualHash:hash}]),
    [{fileId:'b',distance:0}]);
  assert.equal(hashDistance(null,hash),null);
});


test('automatic engine can identify clothing footwear dresses and lingerie',()=>{
 for(const category of ['Tenis','Calzado','Ropa','Vestidos','Lencería','Bolsas','Gorras']){
  const label=CATEGORY_LABELS.find(row=>row[0]===category)?.[1];
  assert.ok(label,'missing CLIP prompt for '+category);
  assert.equal(chooseCategory([{label,score:.92}]).category,category);
 }
 const labels=new Set(CATEGORY_LABELS.map(x=>x[0]));
 assert.equal(labels.size,CATEGORY_LABELS.length,'duplicate prompts must not bias classification');
});
