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
 const rows=response?.query?.search;
 if(!Array.isArray(rows))return [];
 const words=new Set(search.toLowerCase().split(/\W+/).filter(w=>w.length>=3));
 return rows.filter(x=>typeof x.title==='string'&&Number.isInteger(x.pageid))
  .map(x=>{
   const title=x.title.replace(/<[^>]*>/g,'').slice(0,140);
   const shared=[...words].filter(w=>title.toLowerCase().includes(w)).length;
   return {label:title,url:'https://www.wikidata.org/wiki/Q'+x.pageid,
    evidence:'text_search_only',matchedTerms:shared};
  }).filter(x=>x.matchedTerms>=2)
  .sort((a,b)=>b.matchedTerms-a.matchedTerms).slice(0,limit);
}
export async function findWikidataCandidates(query,fetchImpl=fetch){
 const u=new URL('https://www.wikidata.org/w/api.php');
 u.searchParams.set('action','query');u.searchParams.set('list','search');
 u.searchParams.set('srsearch',query);u.searchParams.set('srlimit','8');u.searchParams.set('format','json');
 const r=await fetchImpl(u.toString(),{headers:{'user-agent':'EleganceMXResearch/1.0 (manual candidate review; no bulk crawling)'},signal:AbortSignal.timeout(9000)});
 if(!r.ok)throw new Error('Wikidata search HTTP '+r.status);
 return normalizeCandidates(await r.json(),query);
}
