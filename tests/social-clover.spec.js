const {test,expect}=require('@playwright/test');
const CHAN=['whatsapp','facebook','instagram','tiktok'];
test('four-leaf clover is visible and accessible on phone and redirects to named platforms',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await expect(page.locator('#elegance-social-clover')).toBeVisible();
 await expect(page.locator('#elegance-social-clover .social-clover-leaf')).toHaveCount(4);
 const expected={
  whatsapp:'whatsapp.com',facebook:'facebook.com',instagram:'instagram.com',tiktok:'tiktok.com'
 };
 for(const id of CHAN){
   const link=page.locator('[data-social="'+id+'"]');
   await expect(link).toBeVisible();
   await expect(link).toHaveAttribute('target','_blank');
   await expect(link).toHaveAttribute('rel',/noopener/);
   await expect(link).toHaveAttribute('href',new RegExp('^https://(www\\.)?'+expected[id].replace('.','\\.')+'/'));
 }
 const box=await page.locator('#elegance-social-clover').boundingBox();
 expect(box).not.toBeNull();
 expect(box.x).toBeGreaterThan(200);
 expect(box.y).toBeGreaterThan(580);
 const left=await page.locator('[data-social="facebook"]').boundingBox();
 expect(left).not.toBeNull();
 const popup=page.waitForEvent('popup');
 await page.locator('[data-social="facebook"]').click();
 const newPage=await popup;
 expect(newPage).toBeTruthy();
 await newPage.close();
 await page.locator('.social-clover-center').click();
 await expect(page.locator('#elegance-social-clover')).toHaveClass(/is-folded/);
 await expect(page.locator('.social-clover-center')).toHaveAttribute('aria-expanded','false');
 await page.locator('.social-clover-center').click();
 await expect(page.locator('[data-social="tiktok"]')).toBeVisible();
 await page.screenshot({path:'test-results/elegance-clover-mobile.png'});
});
test('social clover also appears in entire photo archive and does not use wrong shop accounts',async({page})=>{
 await page.goto('/archivo.html');
 await expect(page.locator('#recovery-grid .recovery-card')).toHaveCount(30);
 const links=page.locator('#elegance-social-clover .social-clover-leaf');
 await expect(links).toHaveCount(4);
 for(const id of CHAN){
  const node=page.locator('[data-social="'+id+'"]');
  const href=await node.getAttribute('href');
  expect(href).not.toMatch(/gabycases/i);
  expect(href).not.toMatch(/525547572297/);
 }
});
