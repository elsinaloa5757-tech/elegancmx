const {test,expect}=require('@playwright/test');

for(const width of [390,1280]){
 test('crown-free script Elegance wordmark in storefront at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  await page.goto('/');
  const header=page.locator('.wordmark');
  const hero=page.locator('.hero h1.brand-script');
  await expect(header).toBeVisible();
  await expect(hero).toBeVisible();
  await expect(header).toHaveText('elegance');
  await expect(hero).toHaveText('elegance');
  expect((await header.textContent())).not.toContain('♛');
  expect((await hero.textContent())).not.toContain('♛');
  await expect(page.locator('.wordmark .crown')).toHaveCount(0);
  await expect(page.locator('.hero-crown')).toHaveCount(0);
  const info=await page.evaluate(()=>{
   const h=document.querySelector('.wordmark'),big=document.querySelector('.hero h1');
   return {font:getComputedStyle(h).fontFamily,heroFont:getComputedStyle(big).fontFamily,
    fontStyle:getComputedStyle(h).fontStyle,bounds:h.getBoundingClientRect().toJSON(),
    bigBounds:big.getBoundingClientRect().toJSON()};
  });
  expect(info.font).toContain('Great Vibes');
  expect(info.heroFont).toContain('Great Vibes');
  expect(info.fontStyle).toBe('normal');
  expect(info.bounds.width).toBeGreaterThan(50);
  expect(info.bounds.right).toBeLessThan(width);
  await expect(page.locator('#product-grid .catalog-card')).toHaveCount(30);
 });
}

test('photo archive shares crown-free Elegance script logo',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/archivo.html');
 const logo=page.locator('header .logo');
 const hero=page.locator('.hero h1.brand-script');
 await expect(logo).toHaveText('elegance');
 await expect(hero).toHaveText('elegance');
 await expect(page.locator('.heroOrnament')).toHaveCount(0);
 const fonts=await logo.evaluate(el=>getComputedStyle(el).fontFamily);
 expect(fonts).toContain('Great Vibes');
 await expect(page.locator('#recovery-grid .recovery-card')).toHaveCount(30);
});
