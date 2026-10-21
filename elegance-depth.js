/* Elegance Depth — progressively enhanced, battery-conscious pseudo-3D.
 * CSS artwork uses the original Elegance panther. No tracking, WebGL downloads,
 * external libraries, product modifications, or admin interactions. */
(()=>{
  'use strict';
  const hero=document.querySelector('.hero');
  const scene=hero?.querySelector('.hero-depth');
  if(!hero||!scene)return;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine=window.matchMedia('(hover: hover) and (pointer: fine)');
  let current=null,frame=0,heroFrame=0;
  const resetHero=()=>{
    scene.style.setProperty('--depth-x','0px');
    scene.style.setProperty('--depth-y','0px');
    hero.style.setProperty('--copy-x','0px');
    hero.style.setProperty('--copy-y','0px');
  };
  function clearCard(){
    if(!current)return;
    current.style.removeProperty('--card-rx');
    current.style.removeProperty('--card-ry');
    current.classList.remove('luxury-tilt');
    current=null;
  }
  function onHeroMove(e){
    if(motion.matches||!fine.matches)return;
    const rect=hero.getBoundingClientRect();
    const x=Math.max(-1,Math.min(1,(e.clientX-rect.left)/rect.width*2-1));
    const y=Math.max(-1,Math.min(1,(e.clientY-rect.top)/rect.height*2-1));
    if(heroFrame)cancelAnimationFrame(heroFrame);
    heroFrame=requestAnimationFrame(()=>{
      scene.style.setProperty('--depth-x',(x*12).toFixed(1)+'px');
      scene.style.setProperty('--depth-y',(y*9).toFixed(1)+'px');
      hero.style.setProperty('--copy-x',(x*-3).toFixed(1)+'px');
      hero.style.setProperty('--copy-y',(y*-2).toFixed(1)+'px');
      heroFrame=0;
    });
  }
  hero.addEventListener('pointermove',onHeroMove,{passive:true});
  hero.addEventListener('pointerleave',resetHero,{passive:true});

  const tiltTargets='.catalog-card,.brand-card,.category-tile,.quick-category,.promo-tile';
  document.addEventListener('pointerover',e=>{
    if(motion.matches||!fine.matches||!e.target.closest)return;
    const tile=e.target.closest(tiltTargets);
    if(tile&&tile!==current){clearCard();current=tile;tile.classList.add('luxury-tilt')}
  },{passive:true});
  document.addEventListener('pointermove',e=>{
    if(!current||motion.matches||!fine.matches||!current.isConnected)return;
    const rect=current.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const x=Math.max(-1,Math.min(1,(e.clientX-rect.left)/rect.width*2-1));
    const y=Math.max(-1,Math.min(1,(e.clientY-rect.top)/rect.height*2-1));
    if(frame)cancelAnimationFrame(frame);
    const target=current;
    frame=requestAnimationFrame(()=>{
      if(target===current){
        target.style.setProperty('--card-rx',(-y*3.5).toFixed(2)+'deg');
        target.style.setProperty('--card-ry',(x*4.5).toFixed(2)+'deg');
      }
      frame=0;
    });
  },{passive:true});
  document.addEventListener('pointerout',e=>{
    if(!current||!e.target.closest)return;
    const tile=e.target.closest(tiltTargets);
    if(tile===current&&!tile.contains(e.relatedTarget))clearCard();
  },{passive:true});
  document.addEventListener('pointerdown',clearCard,{passive:true});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){clearCard();resetHero()}
  });
  function settingsChanged(){
    if(motion.matches||!fine.matches){clearCard();resetHero()}
  }
  motion.addEventListener?.('change',settingsChanged);
  fine.addEventListener?.('change',settingsChanged);
  if(!motion.matches&&'IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      for(const e of entries){
        if(e.isIntersecting){
          e.target.classList.add('depth-revealed');
          observer.unobserve(e.target);
        }
      }
    },{threshold:0.08,rootMargin:'0px 0px -18px 0px'});
    document.querySelectorAll('.section-box,.promo-grid').forEach(el=>observer.observe(el));
  }
})();