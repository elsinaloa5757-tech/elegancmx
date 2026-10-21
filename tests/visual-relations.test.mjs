import test from 'node:test';
import assert from 'node:assert/strict';
import {buildRelations} from '../scripts/visual-relations.mjs';
const ai=[
 {fileId:'shoe-a',visualHash:'aaaaaaaaaaaaaaaa',duplicateCandidates:[{fileId:'shoe-b',distance:0},{fileId:'bag',distance:0},{fileId:'shoe-c',distance:3}]},
 {fileId:'shoe-b',visualHash:'aaaaaaaaaaaaaaaa',duplicateCandidates:[{fileId:'shoe-a',distance:0}]},
 {fileId:'bag',visualHash:'aaaaaaaaaaaaaaaa',duplicateCandidates:[]},
 {fileId:'shoe-c',visualHash:'aaaaaaaaaaaaaaaa',duplicateCandidates:[{fileId:'shoe-a',distance:3}]}
];
const routes=[
 {fileId:'shoe-a',category:'Tenis'},{fileId:'shoe-b',category:'Tenis'},
 {fileId:'bag',category:'Bolsas'},{fileId:'shoe-c',category:'Tenis'}
];
test('only very similar photos with same category are suggested; nobody is merged',()=>{
 const result=buildRelations(ai,routes);
 assert.equal(result.verified,false);
 assert.equal(result.candidatePairCount,1);
 assert.deepEqual(result.pairs,[{a:'shoe-a',b:'shoe-b',category:'Tenis',distance:0}]);
 assert.equal(result.pairs[0].a!=='bag',true);
});
test('ignore unclassified, self-referential, or invalid hash suggestions',()=>{
 const result=buildRelations([{fileId:'a',visualHash:'invalid',duplicateCandidates:[{fileId:'a',distance:0}]}],[{fileId:'a',category:null}]);
 assert.equal(result.candidatePairCount,0);
});
