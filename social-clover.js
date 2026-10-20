(()=>{'use strict';
/**
 * Elegance MX social clover. Leaf links always lead to the named platform.
 * Official storefront profile URLs come from data/social-links.json only after verification.
 * Deliberately does not reuse unconfirmed Floot numbers or GabyCases accounts.
 */
const channels=[
 {id:'whatsapp',name:'WhatsApp',fallback:'https://www.whatsapp.com/',allowed:['whatsapp.com','wa.me'],symbol:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.1 11.55a8.12 8.12 0 0 1-8.19 8.07 8.2 8.2 0 0 1-3.8-.93L3.3 20l1.37-4.5a8.03 8.03 0 0 1-.94-3.8A8.14 8.14 0 0 1 12 3.62a8.12 8.12 0 0 1 8.1 7.93Z" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round"/><path d="M8.68 7.7c-.3-.37-.6-.3-.89-.3-.22 0-.58.1-.88.43s-1.16 1.11-1.16 2.68 1.19 3.08 1.35 3.28c.16.22 2.34 3.64 5.77 4.16 1.4.21 2.12.1 2.9-.04.92-.28 1.76-1.12 1.88-1.95.11-.72-.09-.87-.64-1.1l-2.15-.98c-.52-.24-.76-.16-1.03.16l-.98 1.13c-.27.3-.45.32-.97.06-1.54-.78-2.82-1.74-3.76-3.35-.28-.47.02-.72.3-.99.25-.24.54-.62.64-.86.11-.23.07-.47-.06-.73L9.5 8.65c-.23-.56-.51-.91-.82-.95Z" transform="translate(2 1) scale(.8)" fill="currentColor"/></svg>'},
 {id:'facebook',name:'Facebook',fallback:'https://www.facebook.com/',allowed:['facebook.com','fb.com','fb.me'],symbol:'<span class="clover-facebook" aria-hidden="true">f</span>'},
 {id:'instagram',name:'Instagram',fallback:'https://www.instagram.com/',allowed:['instagram.com'],symbol:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2"/><circle cx="12" cy="12" r="4.1"/><circle cx="17.4" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg>'},
 {id:'tiktok',name:'TikTok',fallback:'https://www.tiktok.com/',allowed:['tiktok.com'],symbol:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.4 3v11.25a3.6 3.6 0 1 1-3.67-3.6v3a.61.61 0 1 0 .64.61V3h3.03Zm0 1.1c.75 2.7 2.65 4.32 5.6 4.38v3.06c-2.01 0-3.82-.67-5.6-2.24V4.1Z" fill="currentColor"/></svg>'}
];
const classes=['top-left','top-right','bottom-left','bottom-right'];
const host=document.createElement('nav');
host.id='elegance-social-clover';
host.className='social-clover';
host.setAttribute('aria-label','Redes sociales de Elegance MX');
host.innerHTML=channels.map((c,i)=>
  '<a class="social-clover-leaf social-clover-'+c.id+' social-clover-'+classes[i]+'" '+
  'data-social="'+c.id+'" href="'+c.fallback+'" target="_blank" rel="noopener noreferrer external" '+
  'aria-label="Abrir '+c.name+'; perfil oficial por configurar" title="'+c.name+' · enlace a plataforma">'+
  c.symbol+'</a>').join('')+
  '<button type="button" class="social-clover-center" aria-expanded="true" aria-label="Ocultar enlaces a redes sociales" title="Mostrar u ocultar redes sociales">✦</button>'+
  '<span class="social-clover-caption">SÍGUENOS</span>';
document.body.append(host);
const center=host.querySelector('.social-clover-center');
center.addEventListener('click',()=>{
  const folded=host.classList.toggle('is-folded');
  center.setAttribute('aria-expanded',String(!folded));
  center.setAttribute('aria-label',folded?'Mostrar enlaces a redes sociales':'Ocultar enlaces a redes sociales');
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
fetch('data/social-links.json').then(r=>{
 if(!r.ok)throw Error('social config unavailable');
 return r.json();
}).then(config=>{
 channels.forEach(c=>{
   const node=host.querySelector('[data-social="'+c.id+'"]');
   const row=config?.[c.id];
   const url=allowedUrl(row?.url,c);
   if(!url)return;
   node.href=url;
   if(row.official===true){
     node.setAttribute('aria-label','Abrir '+c.name+' oficial de Elegance MX');
     node.title=c.name+' · Elegance MX';
   }
 });
}).catch(()=>{/* Safe per-platform defaults remain navigable. */});
})();