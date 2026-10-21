import test from 'node:test';
import assert from 'node:assert/strict';
import {auditIdentification} from '../scripts/identification-audit.mjs';
const photo=id=>({fileId:id,mime:'image/webp'});
const media=['a','b','c','d'].map(photo);
const routes=[{fileId:'a',category:'Tenis'},{fileId:'b',category:'Bolsas'}, {fileId:'c',category:null},{fileId:'d',category:'Gorras'}];
const vision=[
 {fileId:'a',status:'requires_review',verified:false,nameSuggestion:'Tenis blancos',categorySuggestion:'Tenis'},
 {fileId:'b',status:'requires_review',verified:false,nameSuggestion:'Tenis negros',categorySuggestion:'Tenis'},
 {fileId:'c',status:'requires_review',verified:false,nameSuggestion:null,categorySuggestion:null},
 {fileId:'d',status:'requires_review',verified:true,nameSuggestion:'No confiable',categorySuggestion:'Bolsas'}
];
const curation={entries:{a:{reviewed:true,category:'Tenis'},b:{reviewed:true,category:'Ropa'},d:{reviewed:false,category:'Bolsas'}}};
test('detect cross-model conflicts while preserving owner labels',()=>{
 const output=auditIdentification({media,routes,vision,curation,relations:{pairs:[{a:'a',b:'b'}]},ai:[]});
 assert.equal(output.photoCount,4);
 assert.equal(output.visionNamed,2);
 assert.equal(output.comparisonCount,2);
 assert.equal(output.modelConflict,1);
 assert.equal(output.unclassified,1);
 assert.equal(output.ownerReviewedCount,2);
 assert.equal(output.ownerAgreement,1);
 assert.equal(output.ownerCompared,2);
 assert.equal(output.ownerMeasuredAccuracy,null,'Only >=30 manual examples permit accuracy estimate');
 assert.deepEqual(output.queue.map(x=>x.fileId),['b','c']);
 assert.equal(output.reviewQueueCount,2);
 assert.equal(output.queue[0].reason,'conflict');
 assert.equal(output.queue[0].suggestedRelated,true);
 assert.equal(output.queue[1].reason,'unclassified');
});
test('unapproved machine responses never count as reviewed truth',()=>{
 const out=auditIdentification({media:[photo('a')],routes:[{fileId:'a',category:'Tenis'}],
 vision:[{fileId:'a',status:'requires_review',verified:true,categorySuggestion:'Bolsas'}],
 curation:{entries:{}},relations:{pairs:[]},ai:[]});
 assert.equal(out.modelConflict,0);
 assert.equal(out.ownerReviewedCount,0);
});

test('owner reviewed similar photo suggests a category but never overwrites the existing route',()=>{
 const photos=[photo('approved'),photo('candidate')];
 const report=auditIdentification({
   media:photos,
   routes:[{fileId:'approved',category:'Tenis'},{fileId:'candidate',category:'Bolsas'}],
   vision:[],ai:[],
   curation:{entries:{}},
   ownerFeedback:[{fileId:'approved',category:'Tenis',verifiedByOwner:true,source:'owner_entered_category'}],
   relations:{pairs:[{a:'approved',b:'candidate',distance:0}]}
 });
 assert.equal(report.ownerReviewedCount,1);
 assert.equal(report.counters.ownerReferenceSuggestions,1);
 const suggested=report.queue.find(x=>x.fileId==='candidate');
 assert.equal(suggested.reason,'conflict');
 assert.equal(suggested.category,'Bolsas','existing categorization remains unchanged');
 assert.equal(suggested.ownerReferenceCategory,'Tenis');
 assert.equal(suggested.ownerReferenceFileId,'approved');
 assert.equal(report.ownerMeasuredAccuracy,null,'A single approved photo is not accuracy evidence');
});
test('contradicting confirmed examples must not produce a category suggestion',()=>{
 const output=auditIdentification({
   media:['a','b','c'].map(photo),
   routes:[{fileId:'a',category:'Tenis'},{fileId:'b',category:'Bolsas'},{fileId:'c',category:null}],
   vision:[],ai:[],
   curation:{entries:{a:{reviewed:true,category:'Tenis'},b:{reviewed:true,category:'Bolsas'}}},
   relations:{pairs:[{a:'a',b:'c',distance:0},{a:'b',b:'c',distance:0}]}
 });
 assert.equal(output.queue.find(x=>x.fileId==='c').ownerReferenceCategory,null);
});
