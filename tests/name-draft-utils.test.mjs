import test from 'node:test';
import assert from 'node:assert/strict';
import {makeNameDrafts} from '../scripts/name-draft-utils.mjs';
const media=[
 {fileId:'a',mime:'image/webp'},{fileId:'b',mime:'image/jpeg'},
 {fileId:'c',mime:'image/webp'},{fileId:'d',mime:'image/webp'},
 {fileId:'v',mime:'video/mp4'}
];
const base={media,routes:[
 {fileId:'a',category:'Bolsas'},{fileId:'b',category:'Tenis'},
 {fileId:'c',category:null},{fileId:'d',category:'Gorras'}],
 vision:[
 {fileId:'a',categorySuggestion:'Bolsas',nameSuggestion:'Bolsa negra',status:'requires_review',verified:false},
 {fileId:'b',categorySuggestion:'Bolsas',nameSuggestion:'Bolsa rosa',status:'requires_review',verified:false},
 {fileId:'c',categorySuggestion:'Tenis',nameSuggestion:'Tenis blancos',status:'requires_review',verified:true}
 ],ocr:[],webRefs:[],curation:{version:1,entries:{d:{reviewed:true,name:'Gorra oficial'}}}};
test('bulk name drafts are automatic, conservative and do not override the owner',()=>{
 const r=makeNameDrafts(base);
 assert.equal(r.stats.total,4);
 assert.equal(r.stats.visualNames,1);
 assert.equal(r.stats.genericNames,2);
 assert.equal(r.stats.pendingNames,1);
 assert.equal(r.records.find(x=>x.fileId==='a').nameSuggestion,'Bolsa negra');
 assert.equal(r.records.find(x=>x.fileId==='b').nameSuggestion,'Tenis · Referencia');
 assert.equal(r.records.find(x=>x.fileId==='c').nameSuggestion,null);
 assert.equal(r.records.find(x=>x.fileId==='d').status,'owner_override');
 assert.equal(r.verified,false);
});
test('OCR and public web text references cannot assert exact brands or models',()=>{
 const b=structuredClone(base);
 b.ocr=[{fileId:'b',verified:false,skuCandidates:['DD1391-100'],brandHints:['Nike']}];
 b.webRefs=[{fileId:'b',verified:false,candidates:[{label:'Nike Dunk Low',url:'https://www.wikidata.org/wiki/Q123'}]}];
 const r=makeNameDrafts(b);
 const p=r.records.find(x=>x.fileId==='b');
 assert.equal(p.nameSuggestion,'Tenis · Referencia');
 assert.equal(p.modelCandidatesFound,1);
 assert.equal(p.skuHintsFound,1);
});
