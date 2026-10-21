const {test,expect}=require('@playwright/test');
test('premium motion layers keep original branding and functional catalogue',async({page})=>{
 await page.goto('/');
 await expect(page.locator('.hero.elegance-motion-hero')).toBeVisible();
 await expect(page.locator('.hero h1.brand-script')).toHaveText('elegance');
 await expect(page.locator('.hero-ambient .hero-orbit')).toHaveCount(2);
 await expect(page.locator('#product-grid .catalog-card')).toHaveCount(30);
 const motion=await page.locator('.hero').evaluate(el=>{
  const s=getComputedStyle(el,'::before');
  return {asset:s.backgroundImage,animation:getComputedStyle(el.querySelector('.hero-copy')).animationName};
 });
 expect(motion.asset).toContain('elegance-panther.png');
 expect(motion.animation).toContain('elegance-enter');
 await page.locator('#brand-rail [data-brand="Nike"]').click();
 await expect(page.locator('#browse-title')).toContainText('Nike');
 await page.locator('#clear-filters').click();
 await expect(page.locator('#product-grid .catalog-card')).toHaveCount(30);
});
test('reduced motion turns off cinematic animations on mobile',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await expect(page.locator('.hero')).toBeVisible();
 const info=await page.evaluate(()=>{
  const hero=document.querySelector('.hero');
  return {animation:getComputedStyle(hero.querySelector('.hero-copy')).animationName,
    orbit:getComputedStyle(document.querySelector('.hero-orbit')).display,
    height:hero.getBoundingClientRect().height};
 });
 expect(info.animation).toBe('none');
 expect(info.orbit).toBe('none');
 expect(info.height).toBeGreaterThanOrEqual(200);
 await expect(page.locator('#product-grid .catalog-card')).toHaveCount(30);
});
