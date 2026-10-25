const {test,expect}=require('@playwright/test');
test('V4 keeps approved identity and provides licensed optional roar', async ({page})=>{
 await page.goto('/showroom.html');
 await expect(page.locator('.brand')).toHaveText('elegance');
 await expect(page.locator('#roar-audio')).toHaveAttribute('src','https://sfxmint.com/dl/short-tiger-roar-01.mp3');
 await expect(page.locator('#roar')).toHaveText(/Rugido/);
 await page.locator('[data-preset="night"]').click();
 await expect(page.locator('[data-preset="night"]')).toHaveAttribute('aria-pressed','true');
 await page.locator('[data-view="left"]').click();
 await expect(page.locator('#camera-state')).toContainText('aproximada');
 await page.locator('#play').click();
 await expect(page.locator('#play')).toHaveAttribute('aria-pressed','false');
 await page.locator('#reset').click();
 await expect(page.locator('#bright')).toHaveValue('75');
});
test('V4 public brand suggestions are clearly unverified and filter photos', async ({page})=>{
 await page.goto('/showroom.html');
 await page.locator('[data-panel="Catálogo"]').click();
 await expect(page.locator('.catalog-item').first()).toBeVisible({timeout:25000});
 const items=await page.locator('#catalog-brand option').count();
 expect(items).toBeGreaterThan(1);
 const selected=await page.locator('#catalog-brand option').nth(1).getAttribute('value');
 await page.locator('#catalog-brand').selectOption(selected);
 await expect(page.locator('#catalog-drawer')).toBeVisible();
 await expect(page.locator('.catalog-item').first()).toBeVisible();
 await expect(page.locator('.catalog-item .category').first()).toContainText(/sugerida, no verificada/);
 await page.locator('#catalog-clear').click();
 await expect(page.locator('#catalog-brand')).toHaveValue('');
});
test('V4 mobile scene and filters have no overflow', async ({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/showroom.html');
 await expect(page.locator('#view')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.locator('[data-panel="Catálogo"]').click();
 await expect(page.locator('#catalog-drawer')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});