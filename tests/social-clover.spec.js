const {test,expect}=require('@playwright/test');
const CHAN=['whatsapp','facebook','instagram','tiktok'];
test('exact user gold-and-ice blue 4-leaf artwork, tap leaves, drag without redirect',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 const host=page.locator('#elegance-social-clover');
 await expect(host).toBeVisible();
 await expect(host.locator('.social-clover-art')).toBeVisible();
 const imageOK=await page.evaluate(async()=>{
  const response=await fetch('/assets/elegance-social-clover.webp');
  const arr=new Uint8Array(await response.arrayBuffer());
  return response.ok&&arr.byteLength>6000&&String.fromCharCode(...arr.slice(0,4))==='RIFF';
 });
 expect(imageOK).toBeTruthy();
 await expect(host.locator('.social-clover-leaf')).toHaveCount(4);
 const expected={whatsapp:'whatsapp.com',facebook:'facebook.com',instagram:'instagram.com',tiktok:'tiktok.com'};
 for(const id of CHAN){
  const link=page.locator('[data-social="'+id+'"]');
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('target','_blank');
  await expect(link).toHaveAttribute('rel',/noopener/);
  await expect(link).toHaveAttribute('href',new RegExp('^https://(www\\.)?'+expected[id].replace('.','\\.')+'/'));
 }
 const before=await host.boundingBox();expect(before).not.toBeNull();
 // 390px phone: previously 48.1px; now 25% larger, about 60.1px.
 expect(before.width).toBeGreaterThan(59);
 expect(before.width).toBeLessThan(62);
 expect(Math.abs(before.height-before.width)).toBeLessThan(1);
 const fb=await page.locator('[data-social="facebook"]').boundingBox();
 expect(fb).not.toBeNull();
 const popups=[];
 page.on('popup',p=>popups.push(p));
 // Start on a social leaf, then MOVE: should drag the entire clover, not open Facebook.
 await page.mouse.move(fb.x+fb.width/2,fb.y+fb.height/2);
 await page.mouse.down();
 await page.mouse.move(fb.x+fb.width/2-126,fb.y+fb.height/2-160,{steps:10});
 await page.mouse.up();
 const after=await host.boundingBox();
 expect(after.x).toBeLessThan(before.x-80);
 expect(after.y).toBeLessThan(before.y-100);
 expect(popups.length).toBe(0);
 const stored=await page.evaluate(()=>localStorage.getItem('elegance_social_clover_position_v2'));
 expect(stored).toContain('"fx"');
 await page.reload();
 const restored=await host.boundingBox();
 expect(Math.abs(restored.x-after.x)).toBeLessThan(5);
 expect(Math.abs(restored.y-after.y)).toBeLessThan(5);
 // A regular TAP still opens the intended social platform.
 const popup=page.waitForEvent('popup');
 await page.locator('[data-social="facebook"]').click();
 const opened=await popup;
 expect(opened).toBeTruthy();
 await opened.close();
 await page.screenshot({path:'test-results/elegance-clover-mobile.png',fullPage:false});
});
test('clover can travel to every screen corner, remains bounded and supports touch pointer events',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 const host=page.locator('#elegance-social-clover');
 const moved=await page.evaluate(()=>{
  const nav=document.getElementById('elegance-social-clover');
  const rect=nav.getBoundingClientRect();
  const id=404;
  const events=(name,x,y)=>nav.dispatchEvent(new PointerEvent(name,{
   bubbles:true,cancelable:true,pointerId:id,pointerType:'touch',isPrimary:true,button:0,clientX:x,clientY:y
  }));
  events('pointerdown',rect.x+45,rect.y+30);
  events('pointermove',5,5);
  events('pointerup',5,5);
  return nav.getBoundingClientRect().toJSON();
 });
 expect(moved.x).toBeGreaterThanOrEqual(3);
 expect(moved.y).toBeGreaterThanOrEqual(3);
 expect(moved.y).toBeLessThan(100);
 await host.focus();
 await page.keyboard.down('Alt');
 await page.keyboard.press('ArrowRight');
 await page.keyboard.up('Alt');
 const again=await host.boundingBox();
 expect(again.x).toBeGreaterThan(moved.x);
 await page.setViewportSize({width:310,height:630});
 const resized=await host.boundingBox();
 expect(resized.x).toBeGreaterThanOrEqual(0);
 expect(resized.y).toBeGreaterThanOrEqual(0);
 expect(resized.x+resized.width).toBeLessThanOrEqual(312);
 expect(resized.y+resized.height).toBeLessThanOrEqual(632);
});
test('same gemstone clover is shown on archive and does not point to GabyCases',async({page})=>{
 await page.goto('/archivo.html');
 await expect(page.locator('#recovery-grid .recovery-card')).toHaveCount(30);
 const links=page.locator('#elegance-social-clover .social-clover-leaf');
 await expect(links).toHaveCount(4);
 await expect(page.locator('.social-clover-art')).toHaveAttribute('src','assets/elegance-social-clover.webp');
 for(const id of CHAN){
  const href=await page.locator('[data-social="'+id+'"]').getAttribute('href');
  expect(href).not.toMatch(/gabycases|525547572297/i);
 }
});


test('25 percent larger clover works on desktops and remains within viewport',async({page})=>{
 await page.setViewportSize({width:1280,height:900});
 await page.goto('/');
 const desktop=await page.locator('#elegance-social-clover').boundingBox();
 expect(desktop).not.toBeNull();
 // Previous compact max was 55.333px; enlarge by 25% -> 69.166px.
 expect(desktop.width).toBeGreaterThan(68);
 expect(desktop.width).toBeLessThan(71);
 expect(Math.abs(desktop.width-desktop.height)).toBeLessThan(1);
 await page.setViewportSize({width:310,height:630});
 // Resize/drag positioning is reconciled by the next animation frame.
 // Poll the settled position rather than racing the resize listener.
 await expect.poll(async()=>{
  const phone=await page.locator('#elegance-social-clover').boundingBox();
  return phone?.x+phone?.width;
 }).toBeLessThanOrEqual(310);
 const phone=await page.locator('#elegance-social-clover').boundingBox();
 expect(phone).not.toBeNull();
 expect(phone.width).toBeGreaterThan(48);
 expect(phone.width).toBeLessThan(51);
 expect(phone.x+phone.width).toBeLessThanOrEqual(310);
 expect(phone.y+phone.height).toBeLessThanOrEqual(630);
});


test('smooth drag moves without layout-jank and does not open a social link',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 const clover=page.locator('#elegance-social-clover');
 const first=await clover.boundingBox();
 const wa=await page.locator('[data-social="whatsapp"]').boundingBox();
 const popups=[];
 page.on('popup',p=>popups.push(p));
 await page.mouse.move(wa.x+wa.width/2,wa.y+wa.height/2);
 await page.mouse.down();
 await page.mouse.move(wa.x+wa.width/2-65,wa.y+wa.height/2-95,{steps:12});
 await expect.poll(()=>clover.evaluate(el=>getComputedStyle(el).transform))
  .not.toBe('none');
 const moving=await clover.boundingBox();
 expect(moving.x).toBeLessThan(first.x-40);
 expect(moving.y).toBeLessThan(first.y-70);
 await page.mouse.up();
 const landed=await clover.boundingBox();
 expect(Math.abs(landed.x-moving.x)).toBeLessThan(4);
 expect(Math.abs(landed.y-moving.y)).toBeLessThan(4);
 expect(popups.length).toBe(0);
 await page.reload();
 const restored=await clover.boundingBox();
 expect(Math.abs(restored.x-landed.x)).toBeLessThan(4);
 expect(Math.abs(restored.y-landed.y)).toBeLessThan(4);
});
