// AI catalogue classification utilities. Suggestions are never product facts.
export const MODEL = 'Xenova/clip-vit-base-patch32';
export const CATEGORY_LABELS = [
  ['Tenis', 'a commercial product photograph of sneakers or athletic shoes'],
  ['Calzado', 'a fashion product photograph of high heels, sandals, boots, or formal shoes, not sneakers'],
  ['Ropa', 'a fashion product photograph of a jacket, hoodie, sweatshirt, sweater, or coat'],
  ['Vestidos', 'a fashion product photograph of a dress or evening gown'],
  ['Lencería', 'a fashion product photograph of lingerie, lingerie set, or intimate underwear'],
  ['Bolsas', 'a commercial product photograph of a purse, luxury handbag, or backpack'],
  ['Playeras', 'a commercial product photograph of a t-shirt or polo shirt'],
  ['Gorras', 'a commercial product photograph of a cap or baseball hat'],
  ['Pantalones', 'a commercial product photograph of trousers, jeans or pants'],
  ['Buckets', 'a commercial product photograph of a bucket hat'],
  ['Relojes', 'a commercial product photograph of a wrist watch'],
  ['Lentes', 'a commercial product photograph of glasses or sunglasses'],
  ['Cinturones', 'a commercial product photograph of a belt'],
  ['Joyería', 'a commercial product photograph of jewelry, a bracelet, a chain or a necklace'],
  ['Accesorios', 'a commercial product photograph of a fashion accessory'],
  ['Fragancias', 'a commercial product photograph of a perfume or fragrance bottle'],
  ['Memorias', 'a commercial product photograph of a USB flash drive or memory card'],
  ['Otro', 'a photograph of an object not listed in other clothing and accessories categories'],
];
export const BRAND_LABELS = [
  'Nike','Jordan','Adidas','New Balance','Puma','Vans','Converse','Louis Vuitton',
  'Dior','Gucci','Prada','Ferragamo','Hermès','Amiri','Off-White','Otro / sin identificar'
];
export function chooseCategory(scores) {
  if (!Array.isArray(scores) || !scores.length) return { category: null, score: null, alternatives: [] };
  const ranked = [...scores].filter(s => Number.isFinite(s.score)).sort((a,b)=>b.score-a.score);
  const best = ranked[0];
  const label = CATEGORY_LABELS.find(([, phrase])=>phrase===best?.label)?.[0] || null;
  return {
    category: label === 'Otro' ? null : label,
    score: best ? Number(best.score.toFixed(4)) : null,
    alternatives: ranked.slice(0,3).map(s=>({
      category:CATEGORY_LABELS.find(([,phrase])=>phrase===s.label)?.[0] || null,
      score:Number(s.score.toFixed(4))
    }))
  };
}
export function chooseBrand(scores) {
  if (!Array.isArray(scores) || !scores.length) return { brand: null, score: null };
  const ranked = [...scores].filter(x=>Number.isFinite(x.score)).sort((a,b)=>b.score-a.score);
  const best=ranked[0], second=ranked[1];
  // Strong relative scores still DO NOT verify a logo, model or authenticity.
  if (!best || best.score < 0.70 || (second && best.score - second.score < 0.4)
      || best.label.includes('Otro')) return { brand:null, score:best?.score ?? null };
  const match=BRAND_LABELS.find(b=>best.label===('a product visibly displaying the '+b+' brand logo'));
  return {brand:match || null, score:Number(best.score.toFixed(4))};
}
export function dhash(raw) {
  if (!raw || raw.length !== 72) throw new Error('Expected grayscale 9x8 bitmap');
  let bits=0n;
  for (let y=0;y<8;y++) for(let x=0;x<8;x++){
    bits=(bits<<1n)|BigInt(raw[y*9+x]>raw[y*9+x+1] ? 1:0);
  }
  return bits.toString(16).padStart(16,'0');
}
export function hashDistance(a,b) {
  if (!/^[a-f0-9]{16}$/i.test(a??'')|| !/^[a-f0-9]{16}$/i.test(b??'')) return null;
  let n=BigInt('0x'+a)^BigInt('0x'+b),count=0;
  while(n){count+=Number(n&1n);n>>=1n}
  return count;
}
export function duplicateCandidates(current, records) {
  if (!current?.visualHash) return [];
  return records.filter(x=>x.fileId!==current.fileId && x.visualHash)
    .map(x=>({fileId:x.fileId,distance:hashDistance(current.visualHash,x.visualHash)}))
    .filter(x=>x.distance!==null&&x.distance<=4)
    .sort((a,b)=>a.distance-b.distance).slice(0,8);
}
