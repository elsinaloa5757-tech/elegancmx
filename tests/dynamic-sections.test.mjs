import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalBrand,createSectionRegistry} from '../scripts/dynamic-sections-utils.mjs';
const image=fileId=>({fileId,mime:'image/webp'});
const base=()=>({
 media:['a','b','c','d','e','f'].map(image),
 routes:[
  {fileId:'a',category:'Bolsas'},{fileId:'b',category:'Tenis'},
  {fileId:'c',category:'Tenis'},{fileId:'d',category:'Bolsas'},
  {fileId:'e',category:'Ropa'},{fileId:'f',category:null}
 ],
 ai:[
  {fileId:'a',brandSuggestion:'Gucci',brandScore:.9},
  {fileId:'b',brandSuggestion:'Converse',brandScore:.84},
  {fileId:'c',brandSuggestion:null},
  {fileId:'d',brandSuggestion:null},
  {fileId:'e',brandSuggestion:null}
 ],
 vision:[
  {fileId:'a',verified:false,status:'requires_review',visualDescriptionUnverified:'Black backpack with zipper'},
  {fileId:'d',verified:false,status:'requires_review',visualDescriptionUnverified:'Small leather wallet for cards'},
  {fileId:'e',verified:false,status:'requires_review',visualDescriptionUnverified:'Blue hoodie for streetwear'},
  {fileId:'f',verified:false,status:'requires_review',visualDescriptionUnverified:'backpack'}
 ],
 ocr:[{fileId:'c',verified:false,brandHints:['Gucci']},
 {fileId:'a',verified:false,brandHints:['Gucci']}],
 curation:{version:1,entries:{c:{reviewed:true,brand:'On Running',category:'Tenis'},d:{reviewed:true,brand:'New Balance 960',category:'Bolsas'}}},
 ownerFeedback:[]
});
test('grows provisionally from recognized specific object and dynamically from owner brands',()=>{
 const x=createSectionRegistry(base());
 assert.equal(x.version,1);assert.equal(x.verified,false);
 assert.equal(x.photoCount,6);
 assert.equal(x.pendingCategoryCount,1);
 assert.equal(x.pendingBrandCount,2);
 assert.deepEqual(x.categories.map(c=>c.name),['Mochilas','Sudaderas']);
 assert.deepEqual(x.brands.map(b=>b.name).sort(),['Converse','Gucci','New Balance','On Running']);
 assert.equal(x.assignments.find(x=>x.fileId==='a').subCategory,'Mochilas');
 assert.equal(x.assignments.find(x=>x.fileId==='a').brandEvidence,'clip_and_ocr');
 assert.equal(x.assignments.find(x=>x.fileId==='c').brandEvidence,'owner_approved');
 assert.equal(x.assignments.find(x=>x.fileId==='d').brand,'New Balance');
 assert.ok(!x.assignments.find(x=>x.fileId==='f'),'unknown category cannot spawn arbitrary new section');
});
test('no invented new brands from OCR-only, invalid input, or irrelevant background',()=>{
 const x=createSectionRegistry(base());
 assert.equal(x.assignments.some(a=>a.fileId==='f'),false);
 assert.equal(canonicalBrand('Gucci'), 'Gucci');
 assert.equal(canonicalBrand('Random Brand'),null);
 assert.equal(canonicalBrand('Acme Studio',{owner:true}),'Acme Studio');
 assert.equal(canonicalBrand('Por verificar',{owner:true}),null);
});
test('owner category overrides never get rewritten by conflicting visual description',()=>{
 const x=base();
 x.curation.entries.e={category:'Tenis',brand:'Vans',reviewed:true};
 const r=createSectionRegistry(x);
 assert.ok(!r.assignments.some(z=>z.fileId==='e'&&z.subCategory==='Sudaderas'));
 assert.equal(r.assignments.find(z=>z.fileId==='e').brandEvidence,'owner_approved');
});
