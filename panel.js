(()=>{'use strict';
/** Elegance MX: an interactive catalog of REAL ImageKit photographs, not verified sellable items. */
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const CATS=['Tenis','Ropa','Gorras','Bolsas','Accesorios','Pantalones','Calzado','Relojes','Lentes','Joyería','Fragancias','Vestidos','Lencería','Cinturones','Buckets','Playeras'];
const PRIMARY=['Tenis','Ropa','Accesorios','Bolsas','Gorras','Pantalones'];
const ACCESSORY_CATS=new Set(['Accesorios','Relojes','Lentes','Cinturones','Joyería','Fragancias']);
const BRANDS=['Nike','Jordan','Adidas','New Balance','Puma','Vans','Otras marcas'];
const MORE_BRANDS=['Louis Vuitton','Gucci','Dior','Prada'];
let expandedBrands=false,expandedCategories=false;
const LS_FAV='elegance_public_favorites_v3',LS_INQ='elegance_public_inquiries_v3';
const getSaved=key=>{try{const a=JSON.parse(localStorage.getItem(key)||'[]');return new Set(Array.isArray(a)?a.filter(x=>typeof x==='string'):[]);}catch{return new Set();}};
const state={media:[],allMedia:[],groups:new Map(),curation:new Map(),adminOverrides:new Map(),mediaById:new Map(),routes:new Map(),ai:new Map(),vision:new Map(),similar:new Map(),favorites:getSaved(LS_FAV),inquiries:getSaved(LS_INQ),filterCat:'',filterConfidence:'all',filterBrand:'',search:'',sort:'new',collection:'',page:0,pageSize:30};
const normalizeCat=cat=>cat==='Playeras'?'Ropa':cat||null;
const getRoute=id=>state.routes.get(id)||{};
const override=id=>({...state.curation.get(id),...state.adminOverrides.get(id)});
const getCat=id=>{const edit=override(id);return edit.category===null?null:normalizeCat(edit.category||getRoute(id).category)};
const suggestionBrand=id=>override(id).brand||state.ai.get(id)?.brandSuggestion||null;
const visualDraft=id=>{
 const v=state.vision.get(id),cat=getCat(id);
 return v?.nameSuggestion&&v.categorySuggestion&&(!cat||normalizeCat(v.categorySuggestion)===cat)?v:null;
};
const getLabel=m=>override(m.fileId).name||getRoute(m.fileId)?.legacyReference?.historicalName||visualDraft(m.fileId)?.nameSuggestion||((getCat(m.fileId)||'Artículo')+' · Referencia');
const shortRef=id=>{let h=2166136261;for(const ch of id)h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;return 'E-'+h.toString(16).padStart(8,'0').toUpperCase()};
const safeImg=m=>{try{const u=new URL(m.url);return u.protocol==='https:'&&u.hostname==='ik.imagekit.io'&&u.pathname.startsWith('/elegancemx/elegance/products/')}catch{return false}};
const item=m=>({id:m.fileId,ref:shortRef(m.fileId),name:getLabel(m),url:m.url,category:getCat(m.fileId)||'Por clasificar'});
function nav(target){
 if(window.matchMedia('(max-width:650px)').matches){$('side-nav').classList.remove('collapsed')}else{$('side-nav').classList.remove('open')}
 $('nav-shade').hidden=true;
 $('toggle-menu').setAttribute('aria-expanded','true');
 if(target==='Inicio'){window.scrollTo({top:0,behavior:'smooth'});return}
 if(target==='Marcas'){$('marcas').scrollIntoView({behavior:'smooth'});return}
 if(target==='Categorías'){$('categorias').scrollIntoView({behavior:'smooth'});return}
 if(target==='Nuevos ingresos'){$('novedades').scrollIntoView({behavior:'smooth'});return}
 if(target==='Combos'){state.collection='combos';state.filterCat='';state.filterBrand='';state.search='';$('site-search').value='';$('filter-category').value='';state.page=0;renderBrowse();$('browse').scrollIntoView({behavior:'smooth'});return}
 if(target==='Ediciones limitadas'){state.collection='limited';state.filterCat='';state.filterBrand='';state.search='';$('site-search').value='';$('filter-category').value='';state.page=0;renderBrowse();$('browse').scrollIntoView({behavior:'smooth'});return}
 if(target==='Combos'){$('promo-combos').scrollIntoView({behavior:'smooth'});return}
 if(target==='Ediciones limitadas'){$('promo-limited').scrollIntoView({behavior:'smooth'});return}
 if(target==='Buscar'){$('site-search').focus();return}
 if(target==='Favoritos'){showList('fav');return}
 if(target==='Consultas'){showList('inq');return}
 state.collection='';state.filterBrand='';state.search='';$('site-search').value='';
 state.filterCat=target==='Accesorios'?'Accesorios':target;
 $('filter-category').value=state.filterCat;
 state.filterConfidence='all';$('filter-confidence').value='all';
 state.page=0;renderBrowse();$('browse').scrollIntoView({behavior:'smooth'});
}
function save(){
 localStorage.setItem(LS_FAV,JSON.stringify([...state.favorites]));
 localStorage.setItem(LS_INQ,JSON.stringify([...state.inquiries]));
 for(const [id,size] of [['fav-count',state.favorites.size],['inquiry-count',state.inquiries.size]]){
   $(id).textContent=String(size);$(id).hidden=!size;
 }
}
function mediaPhoto(m,alt){return '<img loading="lazy" decoding="async" src="'+esc(m.url)+'" alt="'+esc(alt||getLabel(m))+'">'}
function card(m,type='small'){
 const data=item(m),fav=state.favorites.has(m.fileId),inq=state.inquiries.has(m.fileId);
 return '<article class="catalog-card '+(type==='small'?'carousel-product':'')+'">'+
   '<button type="button" class="catalog-photo" data-open="'+esc(m.fileId)+'" aria-label="Ver '+esc(data.ref)+'">'+mediaPhoto(m,data.name)+'</button>'+
   '<button class="floating-heart" type="button" data-fav="'+esc(m.fileId)+'" aria-label="'+(fav?'Quitar favorito':'Guardar favorito')+'">'+(fav?'♥':'♡')+'</button>'+
   '<div class="catalog-card-info"><span class="micro-category">'+esc(data.category)+'</span>'+
   '<button class="card-title" type="button" data-open="'+esc(m.fileId)+'">'+esc(data.name)+'</button>'+
   '<p class="card-ref">'+esc(data.ref)+' · '+(visualDraft(m.fileId)?.nameSuggestion?'Descripción IA · Sin verificar':'Por confirmar')+'</p>'+
   '<button class="query-add" type="button" data-inq="'+esc(m.fileId)+'">'+(inq?'✓ En consultas':'＋ Consultar')+'</button></div></article>';
}
function pick(cat){return state.media.find(m=>cat==='Accesorios'?ACCESSORY_CATS.has(getCat(m.fileId)):getCat(m.fileId)===cat)}
function makeCategoryCard(cat,type){
 const special=cat==='Combos'||cat==='Ediciones limitadas';
 const m= special ? state.media.find(x=>getCat(x.fileId)==='Tenis') : pick(cat);
 const count=special?0:state.media.reduce((n,x)=>n+(cat==='Accesorios'?ACCESSORY_CATS.has(getCat(x.fileId)):getCat(x.fileId)===cat?1:0),0);
 return '<button type="button" class="'+type+'" data-category="'+esc(cat)+'">'+
   (m?mediaPhoto(m,cat):'<span class="category-placeholder">◇</span>')+
   '<span class="category-name">'+esc(cat)+'</span>'+
   '<small>'+ (special?'En preparación':count?count.toLocaleString('es-MX')+' fotos':'En preparación')+'</small></button>';
}
function brandCard(brand){
 const n=state.media.filter(m=>suggestionBrand(m.fileId)===brand).length;
 const photo=state.media.find(m=>suggestionBrand(m.fileId)===brand);
 return '<button type="button" class="brand-card" data-brand="'+esc(brand)+'">'+(photo?'<span class="brand-photo">'+mediaPhoto(photo,'Fotografía con marca sugerida')+'</span>':'')+'<span class="brand-symbol">'+esc(brand==='Nike'?'NIKE':brand==='Jordan'?'✦':brand==='Adidas'?'▲':brand==='New Balance'?'NB':brand==='Puma'?'PUMA':brand==='Vans'?'VANS':'♛')+'</span><strong>'+esc(brand)+'</strong><small>'+ (n?n+' sugerencias':'Por identificar')+'</small></button>';
}
function renderBrands(){
 const names=expandedBrands?[...BRANDS,...MORE_BRANDS]:BRANDS;
 $('brand-rail').innerHTML=names.map(brandCard).join('');
 $('all-brands').textContent=expandedBrands?'Ver menos ↑':'Ver todas →';
 $('all-brands').setAttribute('aria-expanded',String(expandedBrands));
}
function renderCategories(){
 const extra=CATS.filter(cat=>!PRIMARY.includes(cat)&&cat!=='Playeras');
 $('category-grid').innerHTML=(expandedCategories?[...PRIMARY,...extra]:PRIMARY).map(c=>makeCategoryCard(c,'category-tile')).join('');
 $('all-categories').textContent=expandedCategories?'Ver menos ↑':'Ver todas →';
 $('all-categories').setAttribute('aria-expanded',String(expandedCategories));
}
function renderShelves(){
 $('quick-categories').innerHTML=PRIMARY.map(c=>makeCategoryCard(c,'quick-category')).join('');
 renderCategories();renderBrands();
 $('arrivals-rail').innerHTML=state.media.slice(0,22).map(m=>card(m)).join('');
}
function matches(m){
 const cat=getCat(m.fileId),r=getRoute(m.fileId),brand=suggestionBrand(m.fileId);
 if(state.collection==='limited')return false;
 if(state.collection==='combos'&&!['Tenis','Ropa','Accesorios'].includes(cat))return false;
 if(state.filterCat==='Accesorios'&&!ACCESSORY_CATS.has(cat))return false;
 if(state.filterCat&&state.filterCat!=='Accesorios'&&cat!==state.filterCat)return false;
 if(state.filterBrand==='__sin_marca__'&&brand)return false;
 if(state.filterBrand&&state.filterBrand!=='__sin_marca__'&&brand!==state.filterBrand)return false;
 if(state.filterConfidence==='classified'&&!cat)return false;
 if(state.filterConfidence==='pending'&&cat)return false;
 if(state.search){
 const raw=[cat,getLabel(m),r.legacyReference?.historicalName,brand,m.fileId,shortRef(m.fileId)].filter(Boolean).join(' ').toLocaleLowerCase('es-MX');
 if(!raw.includes(state.search))return false;
 }
 return true;
}
function renderBrowse(){
 const found=state.media.filter(matches);
 const list=state.sort==='old'?[...found].reverse():found;
 const pages=Math.max(1,Math.ceil(list.length/state.pageSize));
 state.page=Math.max(0,Math.min(state.page,pages-1));
 const chunk=list.slice(state.page*state.pageSize,(state.page+1)*state.pageSize);
 $('product-grid').innerHTML=chunk.map(m=>card(m,'large')).join('');
 $('browse-count').textContent=found.length.toLocaleString('es-MX')+' fotografías';
 $('browse-title').innerHTML='<span class="ornament">◇</span> '+esc(state.collection==='combos'?'IDEAS PARA COMBOS (SIN PAQUETES CONFIRMADOS)':state.collection==='limited'?'EDICIONES LIMITADAS · EN VERIFICACIÓN':state.filterBrand==='__sin_marca__'?'Otras marcas / sin identificar':state.filterBrand||state.filterCat||'EXPLORAR CATÁLOGO');
 $('no-results').textContent=state.collection==='limited'?'Todavía no hay ediciones limitadas verificadas en el catálogo. Consulta el archivo general para explorar artículos.':'No hay fotografías para esos filtros. Prueba otra categoría o búsqueda.';
 $('no-results').hidden=found.length!==0;
 $('page-label').textContent='Página '+(state.page+1)+' de '+pages;
 $('page-prev').disabled=state.page===0;$('page-next').disabled=state.page+1>=pages;
}
function showItem(id){
 const m=state.mediaById.get(id);if(!m)return;
 const p=item(m),r=getRoute(id),b=suggestionBrand(id),isFav=state.favorites.has(id),isInq=state.inquiries.has(id);
 const group=state.groups.get(override(id).groupId||id)||[m];
 const related=(state.similar.get(id)||[]).map(x=>state.mediaById.get(x)).filter(Boolean).filter(x=>x.fileId!==id).slice(0,8);
 $('item-detail').innerHTML=
  '<div class="detail-image">'+mediaPhoto(m,p.name)+
  (group.length>1?'<div class="detail-gallery" aria-label="Más fotos del artículo">'+group.map(g=>'<button type="button" data-gallery="'+esc(g.fileId)+'" aria-label="Ver otra fotografía">'+mediaPhoto(g,'Otra vista')+'</button>').join('')+'</div>':'')+'</div>'+
  '<div class="detail-text"><span class="micro-category">'+esc(p.category)+'</span>'+
  '<h2>'+esc(p.name)+'</h2><p class="detail-code">Código de referencia: '+esc(p.ref)+'</p>'+
  (b?'<p>Marca sugerida por IA: '+esc(b)+' (sin verificar)</p>':'')+
  (visualDraft(id)?.nameSuggestion?'<p>Identificación visual propuesta por IA (sin verificar): '+esc(visualDraft(id).nameSuggestion)+'. No acredita marca, modelo ni autenticidad.</p>':'')+
  (related.length?'<div class="related-photo-proposals"><p>Fotografías visualmente parecidas (sin agrupar ni confirmar):</p><div class="detail-gallery">'+related.map(x=>'<button type="button" data-similar="'+esc(x.fileId)+'" aria-label="Abrir foto similar '+esc(shortRef(x.fileId))+'">'+mediaPhoto(x,'Otra fotografía similar por verificar')+'</button>').join('')+'</div></div>':'')+
  '<p>Esta es una fotografía del archivo ImageKit. Identificación, agrupación, tallas, precios y existencia pendientes de confirmación.</p>'+
  '<div class="detail-actions"><button type="button" data-fav="'+esc(id)+'">'+(isFav?'♥ Quitar favorito':'♡ Añadir a favoritos')+'</button>'+
  '<button type="button" data-inq="'+esc(id)+'">'+(isInq?'✓ Quitar de consultas':'＋ Agregar a consultas')+'</button>'+
  '<button type="button" data-copy="'+esc(id)+'">Copiar referencia</button></div></div>';
 if(!$('item-dialog').open)$('item-dialog').showModal();
}
async function clipboard(content){
 try{await navigator.clipboard.writeText(content);return true;}
 catch{
   try{const t=document.createElement('textarea');t.value=content;t.style.position='fixed';t.style.left='-9999px';document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();return ok;}catch{return false;}
 }
}
function queriesText(){
 const lines=[...state.inquiries].map(id=>state.mediaById.get(id)).filter(Boolean).map(m=>{
 const v=item(m);return v.ref+' · '+v.name;
 });
 return lines.length?'Hola, me gustaría consultar disponibilidad de estas referencias de Elegance MX:\n'+lines.join('\n'):'Hola, quiero información sobre Elegance MX.';
}
function showList(kind){
 const ids=kind==='fav'?state.favorites:state.inquiries;
 $('list-title').textContent=kind==='fav'?'♡ Mis favoritos':'◇ Lista de consultas';
 $('list-content').innerHTML=[...ids].map(id=>state.mediaById.get(id)).filter(Boolean).map(m=>
   '<div class="saved-row">'+mediaPhoto(m,getLabel(m))+
   '<div><strong>'+esc(getLabel(m))+'</strong><small>'+esc(shortRef(m.fileId))+'</small>'+
   '<div><button type="button" data-open="'+esc(m.fileId)+'">Ver foto</button>'+
   '<button type="button" data-remove="'+esc(kind)+':'+esc(m.fileId)+'">Quitar</button></div></div></div>').join('')||
   '<p>Aún no tienes fotografías guardadas en esta lista.</p>';
 $('list-footer').innerHTML=kind==='inq'&&ids.size?
   '<button id="copy-inquiry" type="button" class="outline-action">Copiar lista de consultas</button><p>Consulta los precios y la disponibilidad antes de hacer un pedido.</p>':'';
 $('list-dialog').showModal();
}
function refreshMediaActions(){
 document.querySelectorAll('[data-fav]').forEach(b=>{
   const active=state.favorites.has(b.dataset.fav);
   b.textContent=b.closest('.detail-actions')?(active?'♥ Quitar favorito':'♡ Añadir a favoritos'):(active?'♥':'♡');
   b.setAttribute('aria-label',active?'Quitar favorito':'Guardar favorito');
 });
 document.querySelectorAll('[data-inq]').forEach(b=>{
   const active=state.inquiries.has(b.dataset.inq);
   b.textContent=b.closest('.detail-actions')?(active?'✓ Quitar de consultas':'＋ Agregar a consultas'):(active?'✓ En consultas':'＋ Consultar');
 });
}
function closeMenu(){
 $('side-nav').classList.remove('open');
 $('nav-shade').hidden=true;
 $('toggle-menu').setAttribute('aria-expanded',String(window.matchMedia('(max-width:650px)').matches&&!$('side-nav').classList.contains('collapsed')));
}
function bind(){
 $('toggle-menu').addEventListener('click',()=>{
   if(window.matchMedia('(max-width:650px)').matches){const collapsed=$('side-nav').classList.toggle('collapsed');$('nav-shade').hidden=true;$('toggle-menu').setAttribute('aria-expanded',String(!collapsed));return;}
   const open=$('side-nav').classList.toggle('open');
   $('nav-shade').hidden=!open;$('toggle-menu').setAttribute('aria-expanded',String(open));
 });
 $('nav-shade').addEventListener('click',closeMenu);
 document.addEventListener('click',async e=>{
   const b=e.target.closest('button,a');if(!b)return;
   if(b.dataset.nav){nav(b.dataset.nav);return}
   if(b.dataset.mobile){nav(b.dataset.mobile);return}
   if(b.dataset.target){document.getElementById(b.dataset.target)?.scrollIntoView({behavior:'smooth'});return}
   if(b.dataset.category){
     if(['Combos','Ediciones limitadas'].includes(b.dataset.category)){nav(b.dataset.category);return;}
     state.collection='';state.filterCat=b.dataset.category;state.filterBrand='';state.search='';$('site-search').value='';
     state.page=0;$('filter-category').value=state.filterCat;renderBrowse();
     $('browse').scrollIntoView({behavior:'smooth'});return
   }
   if(b.dataset.brand){
     state.collection='';state.filterBrand=b.dataset.brand==='Otras marcas'?'__sin_marca__':b.dataset.brand;
     state.filterCat='';$('filter-category').value='';state.page=0;renderBrowse();
     $('browse').scrollIntoView({behavior:'smooth'});return
   }
   if(b.dataset.open){showItem(b.dataset.open);return}
   if(b.dataset.similar){showItem(b.dataset.similar);return}
   if(b.dataset.gallery){const photo=state.mediaById.get(b.dataset.gallery);if(photo){const shown=document.querySelector('#item-detail .detail-image>img');if(shown){shown.src=photo.url;shown.alt=getLabel(photo)}}return}
   if(b.dataset.fav){const id=b.dataset.fav;state.favorites.has(id)?state.favorites.delete(id):state.favorites.add(id);save();refreshMediaActions();return}
   if(b.dataset.inq){const id=b.dataset.inq;state.inquiries.has(id)?state.inquiries.delete(id):state.inquiries.add(id);save();refreshMediaActions();return}
   if(b.dataset.remove){
     const [kind,id]=b.dataset.remove.split(':');(kind==='fav'?state.favorites:state.inquiries).delete(id);
     save();refreshMediaActions();showList(kind);return;
   }
   if(b.dataset.copy){const ok=await clipboard(shortRef(b.dataset.copy));b.textContent=ok?'✓ Copiado':'Código: '+shortRef(b.dataset.copy);return}
 });
 $('site-search').addEventListener('input',e=>{
   state.search=e.target.value.toLocaleLowerCase('es-MX').trim();state.page=0;
   renderBrowse();if(state.search)$('browse').scrollIntoView({behavior:'smooth'});
 });
 $('filter-category').addEventListener('change',e=>{state.filterCat=e.target.value;state.filterBrand='';state.collection='';state.page=0;renderBrowse()});
 $('filter-confidence').addEventListener('change',e=>{state.filterConfidence=e.target.value;state.page=0;renderBrowse()});
 $('filter-sort').addEventListener('change',e=>{state.sort=e.target.value;state.page=0;renderBrowse()});
 $('clear-filters').addEventListener('click',()=>{state.filterCat='';state.filterConfidence='all';state.filterBrand='';state.collection='';state.search='';state.page=0;state.sort='new';$('site-search').value='';$('filter-category').value='';$('filter-confidence').value='all';$('filter-sort').value='new';renderBrowse()});
 $('page-prev').addEventListener('click',()=>{if(state.page>0){state.page--;renderBrowse();$('browse').scrollIntoView()}});
 $('page-next').addEventListener('click',()=>{state.page++;renderBrowse();$('browse').scrollIntoView()});
 $('arrivals-prev').addEventListener('click',()=>{$('arrivals-rail').scrollBy({left:-560,behavior:'smooth'})});
 $('arrivals-next').addEventListener('click',()=>{$('arrivals-rail').scrollBy({left:560,behavior:'smooth'})});
 $('favorites-open').addEventListener('click',()=>showList('fav'));
 $('inquiries-open').addEventListener('click',()=>showList('inq'));
 $('contact-open').addEventListener('click',()=>{$('contact-dialog').showModal()});
 $('profile-open').addEventListener('click',()=>{$('profile-dialog').showModal()});
 $('close-profile').addEventListener('click',()=>$('profile-dialog').close());
 $('profile-favorites').addEventListener('click',()=>{$('profile-dialog').close();showList('fav')});
 $('close-item').addEventListener('click',()=>$('item-dialog').close());
 $('close-list').addEventListener('click',()=>$('list-dialog').close());
 $('close-contact').addEventListener('click',()=>$('contact-dialog').close());
 $('list-footer').addEventListener('click',async e=>{if(e.target.id!=='copy-inquiry')return;const ok=await clipboard(queriesText());e.target.textContent=ok?'✓ Lista copiada':'No se pudo copiar'});
 $('copy-contact-list').addEventListener('click',async()=>{$('copy-feedback').textContent=await clipboard(queriesText())?'Lista copiada. Puedes pegarla en tu conversación con la tienda.':'No se pudo copiar automáticamente.'});
 $('all-brands').addEventListener('click',()=>{expandedBrands=!expandedBrands;renderBrands()});
 $('all-arrivals').addEventListener('click',()=>{
   state.collection='';state.filterCat='';state.filterBrand='';state.filterConfidence='all';state.search='';state.sort='new';state.page=0;
   $('site-search').value='';$('filter-category').value='';$('filter-confidence').value='all';$('filter-sort').value='new';
   renderBrowse();$('browse').scrollIntoView({behavior:'smooth'});
 });
 $('all-categories').addEventListener('click',()=>{expandedCategories=!expandedCategories;renderCategories()});
 $('promo-combos').addEventListener('click',()=>nav('Combos'));
 $('promo-limited').addEventListener('click',()=>nav('Ediciones limitadas'));
 $('side-nav').addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
}
async function boot(){
 bind();
 try{
 const dynamicPromise=Promise.allSettled([
   fetch('https://czekazhacqaamwecjthp.supabase.co/rest/v1/elegance_admin_media?select=imagekit_file_id,url,filename,mime,title,description,brand,category,price,stock,visible,ai_status,created_at&visible=eq.true&order=created_at.desc&limit=1000',{
     headers:{apikey:'sb_publishable_Z51W6iueiL_dmRdmZe6_JQ_WoSirGA3'},signal:AbortSignal.timeout(2500)
   }).then(r=>r.ok?r.json():[]),
   fetch('https://czekazhacqaamwecjthp.supabase.co/functions/v1/elegance-admin',{
     method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'visibility'}),signal:AbortSignal.timeout(2500)
   }).then(r=>r.ok?r.json():{hiddenIds:[]})
 ]);
 const [fm,fr,fa,fc,fv,fg]=await Promise.all([
   fetch('data/imagekit-media.json'),fetch('data/auto-categories.json'),
   fetch('data/ai-classifications.json'),fetch('data/catalog-curation.json'),fetch('data/vision-drafts.json').catch(()=>null),fetch('data/visual-relations.json').catch(()=>null)
 ]);
 if(!fm.ok||!fr.ok||!fc.ok)throw Error('El archivo multimedia no está disponible');
 const [media,routes,ai,curation,visual,relations]=await Promise.all([fm.json(),fr.json(),fa.ok?fa.json():[],fc.json(),fv?.ok?fv.json():[],fg?.ok?fg.json():{pairs:[]}]);
 if(!Array.isArray(media)||!Array.isArray(routes)||!Array.isArray(ai)||curation?.version!==1)throw Error('Formatos no válidos');
 state.routes=new Map(routes.filter(x=>x.fileId).map(x=>[x.fileId,x]));
 state.ai=new Map(ai.filter(x=>x.fileId).map(x=>[x.fileId,x]));
 state.vision=new Map((Array.isArray(visual)?visual:[]).filter(x=>x.fileId&&x.status==='requires_review'&&x.verified===false).map(x=>[x.fileId,x]));
 state.curation=new Map(Object.entries(curation.entries||{}));
 state.similar=new Map();
 if(relations?.verified===false&&Array.isArray(relations.pairs)){
  for(const p of relations.pairs){
   if(!p.a||!p.b||p.a===p.b||p.distance>1)continue;
   for(const [a,b] of [[p.a,p.b],[p.b,p.a]]){
    const arr=state.similar.get(a)||[];
    if(arr.length<12&&!arr.includes(b)){arr.push(b);state.similar.set(a,arr)}
   }
  }
 }
 const liveResult=await dynamicPromise;
 const publicRecords=liveResult[0]?.status==='fulfilled'&&Array.isArray(liveResult[0].value)?liveResult[0].value:[];
 const hiddenIds=new Set(liveResult[1]?.status==='fulfilled'&&Array.isArray(liveResult[1].value?.hiddenIds)?liveResult[1].value.hiddenIds:[]);
 const liveMedia=publicRecords.map(row=>({
  fileId:row.imagekit_file_id,url:row.url,mime:row.mime,createdAt:row.created_at
 })).filter(safeImg);
 state.adminOverrides=new Map(publicRecords.map(row=>[row.imagekit_file_id,{
  ...(row.title?{name:row.title}:{}),
  ...(row.category?{category:row.category}:{}),
  ...(row.brand?{brand:row.brand}:{}),
  ...(row.price!==null?{price:row.price}:{}),
  ...(row.stock!==null?{stock:row.stock}:{}),
  hidden:false
 }]));
 const unique=new Map([...liveMedia,...media].filter(m=>m.mime?.startsWith('image/')&&safeImg(m)&&!hiddenIds.has(m.fileId)).map(m=>[m.fileId,m]));
 state.allMedia=[...unique.values()].sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
 state.mediaById=new Map(state.allMedia.map(m=>[m.fileId,m]));
 state.groups=new Map();
 for(const m of state.allMedia){
  if(override(m.fileId).hidden)continue;
  const key=override(m.fileId).groupId||m.fileId;
  if(!state.groups.has(key))state.groups.set(key,[]);
  state.groups.get(key).push(m);
 }
 state.media=[...state.groups.entries()].map(([key,photos])=>photos.find(x=>x.fileId===key)||photos[0]);
 const options=[...new Set(CATS.map(normalizeCat))];
 $('filter-category').innerHTML='<option value="">Todas las categorías</option>'+
 options.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('');
 for(const set of [state.favorites,state.inquiries]){for(const id of set)if(!state.mediaById.has(id))set.delete(id);}
 save();renderShelves();renderBrowse();
 const videos=[...publicRecords.map(row=>({fileId:row.imagekit_file_id,url:row.url,mime:row.mime,createdAt:row.created_at})),...media].filter(m=>m.mime?.startsWith('video/')&&safeImg(m)&&!hiddenIds.has(m.fileId));
 $('videos-preview').innerHTML=videos.slice(0,4).map(m=>'<article><video controls preload="none" playsinline src="'+esc(m.url)+'" aria-label="Video de Elegance"></video></article>').join('');
 }catch(err){
   $('product-grid').innerHTML='';
   $('no-results').hidden=false;
   $('no-results').textContent='No fue posible cargar el catálogo: '+err.message;
 }
}
let pendingRefresh=false;
window.addEventListener('elegance:catalog-refresh',()=>{
 if(pendingRefresh)return;
 pendingRefresh=true;
 const dlg=document.getElementById('admin-dialog');
 if(dlg?.open)dlg.addEventListener('close',()=>window.location.reload(),{once:true});
 else window.location.reload();
});
boot();
})();