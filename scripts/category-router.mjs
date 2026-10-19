/** Source-aware, conservative routing for Elegance category photo drafts. */
export const TAXONOMY=[
  'Tenis','Calzado','Bolsas','Playeras','Ropa','Vestidos','Lencería','Gorras','Pantalones',
  'Buckets','Relojes','Lentes','Cinturones','Joyería','Fragancias','Accesorios','Memorias'
];
function fold(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
export function parseLegacyTsv(input){
 const lines=input.trim().split(/\r?\n/);
 if(lines.shift()!=='id|assetkey|historicalName|historicalCategory')throw Error('Invalid legacy header');
 const rows=lines.map((l,i)=>{
   const [id,assetkey,historicalName,historicalCategory,...rest]=l.split('|');
   if(rest.length||!Number.isSafeInteger(Number(id))||!/[a-f0-9-]{36}/.test(assetkey)||!historicalName||!historicalCategory)throw Error('Bad row '+i);
   return {id:Number(id),assetkey,historicalName,historicalCategory};
 });
 if(new Set(rows.map(x=>x.assetkey)).size!==rows.length)throw Error('Duplicate historical image key');
 return rows;
}
const ROUTES=[
 ['Bolsas',/\b(bolso|mochila|monedero|tarjetero|cartera|bolsa)\b/],
 ['Calzado',/\b(mules?|slingback|zapatos?|sandalias?|zuecos|calzado|tac[oó]n)\b/],
 ['Tenis',/\b(tenis|sneakers?)\b/],
 ['Relojes',/\b(reloj|cron[oó]grafo)\b/],
 ['Lentes',/\b(lentes|gafas)\b/],
 ['Cinturones',/\b(cintur[oó]n)\b/],
 ['Joyería',/\b(pulsera|joya|collar|aretes)\b/],
 ['Fragancias',/\b(fragancias?|perfumes?)\b/],
 ['Gorras',/\b(gorra|cachucha)\b/],
 ['Pantalones',/\b(pantal[oó]n|jeans|leggings?)\b/],
 ['Vestidos',/\b(vestido|bata)\b/],
 ['Lencería',/\b(tanga|tangas|lencer[ií]a)\b/],
 ['Playeras',/\b(playera|polo)\b/],
 ['Ropa',/\b(chamarra|su[eé]ter|prenda|camiseta|blusa)\b/]
];
export function routeLegacyTitle(name){
 const text=fold(name);
 if(/\b(formulario|sin identificar|plantilla|prueba|demo)\b/.test(text))return null;
 return ROUTES.find(([,p])=>p.test(text))?.[0]||null;
}
export function autoCategorize({historical,ai}){
 // Historical photo identified by exact original ImageKit asset GUID.
 if(historical){
   const cat=routeLegacyTitle(historical.historicalName);
   return {
     category:cat,status:cat?'auto_draft':'manual_review',
     source:cat?'legacy_name':'unidentified_historical',
     score:null
   };
 }
 if(ai?.categorySuggestion){
   const top=Number(ai.categoryScore),runnerUp=Number(ai.otherCategories?.[1]?.score??0);
   const valid=TAXONOMY.includes(ai.categorySuggestion);
   // CLIP probabilities are NOT calibrated. Use conservative score + separation.
   if(valid&&top>=0.6&&(top-runnerUp)>=0.18){
     return {category:ai.categorySuggestion,status:'auto_draft',source:'clip',score:top};
   }
 }
 return {category:null,status:'manual_review',source:ai?'low_confidence':'not_analyzed',score:ai?.categoryScore??null};
}
