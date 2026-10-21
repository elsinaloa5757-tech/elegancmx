/** Free source-backed candidate discovery. No reverse-image claim, no paid API.
 * Searches the public MediaWiki/Wikidata index only for sufficiently specific
 * human-reviewed model names (or an unmistakable product code). The results
 * remain hypotheses for human verification, not product facts.
 */
const MODEL_CODE=/\b[A-Z0-9]{2,}[-_][A-Z0-9-]{2,}\b/i;
const GENERIC=/^(?:tenis|bolsa|gorra|ropa|reloj|lentes|calzado|playera|pantal[oó]n|fragancia|accesorio|vestido|joyer[ií]a|cintur[oó]n|prenda)(?:\s+(?:negros?|blancos?|rojos?|azules?|verdes?|rosas?|plateados?|dorados?|grises?|deportivos?|beige|marrones?)){0,3}$/i;
const BRAND=/\b(Nike|Jordan|Adidas|New Balance|Puma|Vans|Converse|Reebok|Asics|Louis Vuitton|Gucci|Dior|Prada|Coach|Michael Kors|Rolex|Casio|Ray-Ban|Oakley|Seiko|Tissot|Chanel|Herm[eè]s|Ferragamo)\b/i;
export function queryForProduct({name='',brand='',description=''}={}){
 const title=String(name).trim().slice(0,100);
 const brandText=String(brand).trim().slice(0,40);
 const sku=String(name+' '+description).match(MODEL_CODE)?.[0];
 if(sku&&brandText) return (brandText+' '+sku).slice(0,110);
 if(!title||GENERIC.test(title)||title.split(/\s+/).length<2)return null;
 const identifiedBrand=BRAND.test(brandText)?brandText:BRAND.test(title)?title.match(BRAND)[0]:null;
 if(!identifiedBrand)return null;
 if(!/[a-zA-Z0-9]/.test(title))return null;
 // A brand + just a category is not a model query; reject ambiguous terms.
 const meaningful=title.replace(BRAND,'').replace(/\b(tenis|bolsa|gorra|zapatos?|reloj|original|deportivos?|sneakers?|modelo|retro|calzado)\b/ig,'').trim();
 if(!sku && meaningful.length<3)return null;
 return (identifiedBrand+' '+title.replace(new RegExp(identifiedBrand.replace(/[.*+?^$\{\}()|[\]\\]/g,'\\$&'),'i'),'').trim()).slice(0,110);
}
export function normalizeCandidates(response,search,limit=3){
 // wbsearchentities returns real Wikidata Q identifiers and readable labels.
 // A MediaWiki pageid is NOT a Wikidata entity ID.
 const rows=response?.search;
 if(!Array.isArray(rows))return [];
 const terms=[...new Set(String(search).toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>=3))];
 return rows.filter(x=>/^Q[1-9][0-9]*$/.test(x.id||'')&&typeof x.label==='string')
  .map(x=>{
   const label=x.label.replace(/<[^>]*>/g,'').slice(0,140);
   const desc=String(x.description||'').replace(/<[^>]*>/g,'').slice(0,160);
   const haystack=(label+' '+desc).toLowerCase();
   const count=terms.filter(w=>haystack.includes(w)).length;
   return {label,description:desc,url:'https://www.wikidata.org/wiki/'+x.id,
     evidence:'public_catalog_text_search_only',matchedTerms:count};
  }).filter(x=>x.matchedTerms>=Math.min(2,terms.length))
  .sort((a,b)=>b.matchedTerms-a.matchedTerms).slice(0,limit);
}
export async function findWikidataCandidates(query,fetchImpl=fetch){
 const u=new URL('https://www.wikidata.org/w/api.php');
 u.searchParams.set('action','wbsearchentities');
 u.searchParams.set('search',query);u.searchParams.set('language','en');
 u.searchParams.set('uselang','en');u.searchParams.set('limit','8');
 u.searchParams.set('format','json');
 const r=await fetchImpl(u.toString(),{
  headers:{'user-agent':'EleganceMXResearch/1.1 (https://github.com/elsinaloa5757-tech/elegancmx; limited catalog lookups)',
    accept:'application/json'},
  signal:AbortSignal.timeout(12000)
 });
 if(!r.ok)throw new Error('Wikidata search HTTP '+r.status);
 return normalizeCandidates(await r.json(),query);
}
