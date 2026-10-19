(()=>{
/**
 * Elegance MX — public recovery gallery.
 * Displays real ImageKit PHOTO REFERENCES, not fabricated products.
 * No prices, stock, brand, authenticity or add-to-cart for unverified media.
 */
const $ = id=>document.getElementById(id);
const ESC = value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const KNOWN=['Tenis','Calzado','Bolsas','Playeras','Ropa','Vestidos','Lencería','Gorras',
  'Pantalones','Buckets','Relojes','Lentes','Cinturones','Joyería','Fragancias','Accesorios','Memorias'];
const PAGE_SIZE=30;
const view={media:[],categories:new Map(),videos:[],filter:'Todas',q:'',page:0};
function isImage(m) {
  if(!m||!m.mime?.startsWith('image/'))return false;
  try {const u=new URL(m.url);return u.protocol==='https:'&&u.hostname==='ik.imagekit.io'
      &&u.pathname.startsWith('/elegancemx/elegance/products/');}catch{return false;}
}
function isVideo(m) {
  if(!m||!m.mime?.startsWith('video/'))return false;
  try {const u=new URL(m.url);return u.protocol==='https:'&&u.hostname==='ik.imagekit.io'
      &&u.pathname.startsWith('/elegancemx/elegance/products/');}catch{return false;}
}
function filterMedia(){
  return view.media.filter(m=>{
    const route=view.categories.get(m.fileId),cat=route?.category||null;
    if(view.filter==='Pendientes'&&cat)return false;
    if(view.filter!=='Todas'&&view.filter!=='Pendientes'&&cat!==view.filter)return false;
    const fields=[route?.category,route?.legacyReference?.historicalName,m.fileId,m.name,m.filePath];
    return !view.q||fields.filter(Boolean).join(' ').toLocaleLowerCase('es-MX').includes(view.q);
  });
}
function fileCard(m){
 const route=view.categories.get(m.fileId);
 const cat=route?.category||'Por identificar', historical=route?.legacyReference?.historicalName;
 const label=historical||('Fotografía de '+cat.toLocaleLowerCase('es-MX'));
 const confidence=route?.category?'Categoría propuesta':'Clasificación pendiente';
 const id='IK-'+m.fileId;
 return '<article class="recovery-card" data-id="'+ESC(m.fileId)+'">'+
    '<img loading="lazy" decoding="async" src="'+ESC(m.url)+'" alt="'+ESC(label)+'">'+
    '<div class="recovery-content"><span class="recovery-pill">'+ESC(cat)+'</span>'+
    '<h3>'+ESC(label)+'</h3>'+
    '<p>'+ESC(confidence)+(historical?' · Nombre histórico por confirmar':'')+'</p>'+
    '<div class="recovery-actions"><small>Referencia '+ESC(id.slice(0,15))+'</small>'+
    '<button type="button" data-copy="'+ESC(id)+'" aria-label="Copiar referencia">Copiar referencia</button></div></div>'+
    '</article>';
}
function render(){
 const list=filterMedia(),totalPages=Math.max(1,Math.ceil(list.length/PAGE_SIZE));
 view.page=Math.min(view.page,totalPages-1);
 $('recovery-grid').innerHTML=list.slice(view.page*PAGE_SIZE,(view.page+1)*PAGE_SIZE).map(fileCard).join('');
 $('recovery-amount').textContent=list.length.toLocaleString('es-MX')+' fotografías del archivo';
 $('recovery-page').textContent='Página '+(view.page+1)+' de '+totalPages;
 $('recovery-prev').disabled=view.page===0;
 $('recovery-next').disabled=view.page>=totalPages-1;
 $('recovery-status').textContent=list.length?
   'Archivo fotográfico de Elegance MX. Categorías automáticas sujetas a revisión; consulta disponibilidad antes de comprar.':
   'No hay fotografías con ese filtro. Prueba otra categoría o búsqueda.';
 $('recovery-cat').querySelectorAll('button').forEach(b=>b.classList.toggle('current',b.dataset.filter===view.filter));
}
function showVideos(){
 const root=$('recovery-videos');
 if(!view.videos.length){root.hidden=true;return;}
 root.hidden=false;
 $('recovery-video-count').textContent=view.videos.length+' videos recuperados';
 $('recovery-video-grid').innerHTML=view.videos.map(m=>
   '<article class="recovery-video"><video controls preload="none" playsinline src="'+ESC(m.url)+'" aria-label="Video recuperado de Elegance MX"></video>'+
   '<p>Video del archivo · '+ESC(m.fileId.slice(0,12))+'</p></article>').join('');
}
async function start(){
 try{
 const responses=await Promise.all([
    fetch('data/imagekit-media.json'),fetch('data/auto-categories.json')
 ]);
 if(!responses[0].ok)throw Error('Inventario ImageKit inaccesible');
 const media=await responses[0].json(), routes=responses[1].ok?await responses[1].json():[];
 if(!Array.isArray(media)||!Array.isArray(routes))throw Error('Datos de catálogo inválidos');
 view.media=media.filter(isImage).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
 view.categories=new Map(routes.filter(x=>x?.fileId).map(x=>[x.fileId,x]));
 view.videos=media.filter(isVideo);
 const types=new Set(view.media.map(x=>view.categories.get(x.fileId)?.category).filter(Boolean));
 const choices=['Todas',...KNOWN.filter(cat=>types.has(cat)),'Pendientes'];
 $('recovery-cat').innerHTML=choices.map(cat=>
   '<button type="button" data-filter="'+ESC(cat)+'" aria-pressed="'+(cat==='Todas')+'">'+
   ESC(cat)+'</button>').join('');
 $('recovery-count').textContent=view.media.length.toLocaleString('es-MX');
 $('recovery-known').textContent=view.media.filter(x=>view.categories.get(x.fileId)?.category).length.toLocaleString('es-MX');
 showVideos();render();
 }catch(error){
   $('recovery-status').textContent='No se pudo cargar el archivo: '+error.message;
   $('recovery-grid').innerHTML='';
 }
}
$('recovery-cat').addEventListener('click',event=>{
 const btn=event.target.closest('[data-filter]');if(!btn)return;
 view.filter=btn.dataset.filter;view.page=0;render();
 $('recovery-cat').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));
});
$('recovery-search').addEventListener('input',event=>{view.q=event.target.value.trim().toLocaleLowerCase('es-MX');view.page=0;render();});
$('recovery-prev').addEventListener('click',()=>{if(view.page>0){view.page--;render();$('recovery').scrollIntoView();}});
$('recovery-next').addEventListener('click',()=>{view.page++;render();$('recovery').scrollIntoView();});
$('recovery-grid').addEventListener('click',async event=>{
 const btn=event.target.closest('[data-copy]');if(!btn)return;
 try {await navigator.clipboard.writeText(btn.dataset.copy);btn.textContent='Copiada';}
 catch {btn.textContent='Referencia: '+btn.dataset.copy;}
});
start();

})();
