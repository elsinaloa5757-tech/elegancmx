(()=>{'use strict';
/* Elegance MX: approved blue-ice gemstone clover with touch drag.
   Each petal stays an external link; a drag never activates it. */
const channels=[
 {id:'whatsapp',name:'WhatsApp',fallback:'https://www.whatsapp.com/',allowed:['whatsapp.com','wa.me'],symbol:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.1 11.55a8.12 8.12 0 0 1-8.19 8.07 8.2 8.2 0 0 1-3.8-.93L3.3 20l1.37-4.5a8.03 8.03 0 0 1-.94-3.8A8.14 8.14 0 0 1 12 3.62a8.12 8.12 0 0 1 8.1 7.93Z" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round"/><path d="M8.68 7.7c-.3-.37-.6-.3-.89-.3-.22 0-.58.1-.88.43s-1.16 1.11-1.16 2.68 1.19 3.08 1.35 3.28c.16.22 2.34 3.64 5.77 4.16 1.4.21 2.12.1 2.9-.04.92-.28 1.76-1.12 1.88-1.95.11-.72-.09-.87-.64-1.1l-2.15-.98c-.52-.24-.76-.16-1.03.16l-.98 1.13c-.27.3-.45.32-.97.06-1.54-.78-2.82-1.74-3.76-3.35-.28-.47.02-.72.3-.99.25-.24.54-.62.64-.86.11-.23.07-.47-.06-.73L9.5 8.65c-.23-.56-.51-.91-.82-.95Z" transform="translate(2 1) scale(.8)" fill="currentColor"/></svg>'},
 {id:'facebook',name:'Facebook',fallback:'https://www.facebook.com/',allowed:['facebook.com','fb.com','fb.me'],symbol:'<span class="clover-facebook" aria-hidden="true">f</span>'},
 {id:'instagram',name:'Instagram',fallback:'https://www.instagram.com/',allowed:['instagram.com'],symbol:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2"/><circle cx="12" cy="12" r="4.1"/><circle cx="17.4" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg>'},
 {id:'tiktok',name:'TikTok',fallback:'https://www.tiktok.com/',allowed:['tiktok.com'],symbol:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.4 3v11.25a3.6 3.6 0 1 1-3.67-3.6v3a.61.61 0 1 0 .64.61V3h3.03Zm0 1.1c.75 2.7 2.65 4.32 5.6 4.38v3.06c-2.01 0-3.82-.67-5.6-2.24V4.1Z" fill="currentColor"/></svg>'}
];

const byId=new Map(channels.map(c=>[c.id,c]));
const order=[
 {id:'whatsapp',position:'top-left'},
 {id:'facebook',position:'top-right'},
 {id:'tiktok',position:'bottom-left'},
 {id:'instagram',position:'bottom-right'}
];
const host=document.createElement('nav');
host.id='elegance-social-clover';
host.className='social-clover jewel-clover';
host.setAttribute('aria-label','Trébol de redes sociales de Elegance MX: arrastra para moverlo');
host.setAttribute('aria-description','Mantén presionado y desliza para mover el trébol. Toca una hoja para abrir su red social. Con teclado, mantén Alt y usa las flechas para moverlo.');
host.tabIndex=0;
host.innerHTML='<img class="social-clover-art" src="assets/elegance-social-clover.webp" alt="" draggable="false" aria-hidden="true">'+
 order.map(({id,position})=>{
   const c=byId.get(id);
   return '<a class="social-clover-leaf social-clover-'+id+' social-clover-'+position+'" data-social="'+id+'"'+
     ' href="'+c.fallback+'" draggable="false" target="_blank" rel="noopener noreferrer external"'+
     ' aria-label="Abrir '+c.name+'; perfil oficial por configurar" title="'+c.name+' · Elegance MX">'+
     '<span class="sr-only">'+c.name+'</span></a>';
 }).join('')+
 '<span class="social-clover-stem" aria-hidden="true"></span>';
document.body.append(host);
host.addEventListener('dragstart',event=>event.preventDefault());
const STORAGE_KEY='elegance_social_clover_position_v2';
const clamp=(value,min,max)=>Math.max(min,Math.min(value,max));
const viewport=()=>({w:document.documentElement.clientWidth||window.innerWidth,
 h:window.innerHeight});
const dimensions=()=>({width:host.getBoundingClientRect().width,height:host.getBoundingClientRect().height});
// Permanent coordinates are stored as viewport fractions. During a drag, update
// only the transform, not layout-based top/left or DOM measurements on every event.
let placement=null;
function applyPosition(x,y) {
 const v=viewport(),d=dimensions();
 const left=clamp(x,4,Math.max(4,v.w-d.width-4));
 const top=clamp(y,4,Math.max(4,v.h-d.height-4));
 host.style.transform='';
 host.style.left=left+'px';
 host.style.top=top+'px';
 host.style.right='auto';
 host.style.bottom='auto';
 placement={x:left,y:top};
}
function savePosition() {
 try{
  const v=viewport(),d=dimensions();
  const p=placement||{x:0,y:0};
  localStorage.setItem(STORAGE_KEY,JSON.stringify({
   fx:clamp(p.x/Math.max(1,v.w-d.width),0,1),
   fy:clamp(p.y/Math.max(1,v.h-d.height),0,1)
  }));
 }catch{/* Local storage disabled: the clover remains movable. */}
}
function loadPosition() {
 const v=viewport(),d=dimensions();
 let coords=null;
 try {
  const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
  if(saved&&Number.isFinite(saved.fx)&&Number.isFinite(saved.fy)){
   coords={x:clamp(saved.fx,0,1)*Math.max(0,v.w-d.width),
    y:clamp(saved.fy,0,1)*Math.max(0,v.h-d.height)};
  }
 }catch{/* No valid saved position. */}
 if(!coords)coords={x:v.w-d.width-14,y:v.h-d.height-16};
 applyPosition(coords.x,coords.y);
}
loadPosition();
let pointer=null;
let frame=0;
let blockClick=false;
function movePreview() {
 frame=0;
 if(!pointer||!pointer.dragging)return;
 host.style.transform='translate3d('+pointer.dx+'px,'+pointer.dy+'px,0)';
}
function cancelPreview() {
 if(frame){cancelAnimationFrame(frame);frame=0;}
 host.style.transform='';
}
host.addEventListener('pointerdown',event=>{
 if(event.button!==0||pointer||!event.isPrimary)return;
 const rect=host.getBoundingClientRect();
 const v=viewport();
 pointer={
  id:event.pointerId,
  startX:event.clientX,startY:event.clientY,
  initialX:rect.left,initialY:rect.top,
  width:rect.width,height:rect.height,viewport:v,
  x:rect.left,y:rect.top,dx:0,dy:0,dragging:false
 };
 // No pointer capture for ordinary taps: a real leaf click must still navigate.
});
document.addEventListener('pointermove',event=>{
 if(!pointer||event.pointerId!==pointer.id)return;
 const dx=event.clientX-pointer.startX,dy=event.clientY-pointer.startY;
 if(!pointer.dragging&&Math.hypot(dx,dy)>5){
  pointer.dragging=true;
  host.classList.add('is-dragging');
 }
 if(!pointer.dragging)return;
 if(event.cancelable)event.preventDefault();
 const p=pointer,v=p.viewport;
 p.x=clamp(p.initialX+dx,4,Math.max(4,v.w-p.width-4));
 p.y=clamp(p.initialY+dy,4,Math.max(4,v.h-p.height-4));
 p.dx=p.x-p.initialX;
 p.dy=p.y-p.initialY;
 if(!frame)frame=requestAnimationFrame(movePreview);
},{passive:false});
function endPointer(event) {
 if(!pointer||event.pointerId!==pointer.id)return;
 const p=pointer;
 pointer=null;
 cancelPreview();
 host.classList.remove('is-dragging');
 if(p.dragging){
  applyPosition(p.x,p.y);
  savePosition();
  blockClick=true;
 }
}
document.addEventListener('pointerup',endPointer);
document.addEventListener('pointercancel',endPointer);
host.addEventListener('click',event=>{
 if(!blockClick)return;
 event.preventDefault();
 event.stopImmediatePropagation();
 blockClick=false;
},true);
// Do not suppress the NEXT intentional tap when a browser omits the post-drag click.
host.addEventListener('pointerdown',()=>{blockClick=false;},true);
host.addEventListener('keydown',event=>{
 if(!event.altKey||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
 event.preventDefault();
 const p=placement||{x:host.getBoundingClientRect().left,y:host.getBoundingClientRect().top};
 const step=event.shiftKey?32:12;
 const dx=event.key==='ArrowRight'?step:event.key==='ArrowLeft'?-step:0;
 const dy=event.key==='ArrowDown'?step:event.key==='ArrowUp'?-step:0;
 applyPosition(p.x+dx,p.y+dy);
 savePosition();
});
window.addEventListener('resize',()=>{
 if(!placement)return;
 applyPosition(placement.x,placement.y);
 savePosition();
});
function allowedUrl(value,channel){
 if(typeof value!=='string')return null;
 try{
  const u=new URL(value);
  if(u.protocol!=='https:'||u.username||u.password)return null;
  const domain=u.hostname.toLowerCase().replace(/^www\./,'');
  if(!channel.allowed.some(allowed=>domain===allowed||domain.endsWith('.'+allowed)))return null;
  return u.href;
 }catch{return null}
}
fetch('data/social-links.json').then(response=>{
 if(!response.ok)throw Error('Social configuration unavailable');
 return response.json();
}).then(config=>{
 channels.forEach(c=>{
  const node=host.querySelector('[data-social="'+c.id+'"]');
  const row=config?.[c.id],url=allowedUrl(row?.url,c);
  if(!url||!node)return;
  node.href=url;
  if(row.official===true)node.setAttribute('aria-label','Abrir '+c.name+' oficial de Elegance MX');
 });
}).catch(()=>{/* Safe platform defaults still work. */});
})();