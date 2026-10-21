const {test,expect}=require('@playwright/test');
test('public archive loads real ImageKit photos and original panther',async({page})=>{
 await page.goto('/archivo.html');
 await expect(page).toHaveTitle(/Elegance MX/);
 await expect(page.locator('.hero')).toBeVisible();
 const imageCount=await page.evaluate(async()=> (await(await fetch('data/imagekit-media.json')).json()).filter(m=>m.mime?.startsWith('image/')).length);
 await expect(page.locator('#recovery-count')).toHaveText(imageCount.toLocaleString('en-US'));
 await expect(page.locator('#recovery-grid .recovery-card')).toHaveCount(30);
 await expect(page.locator('#recovery-grid img')).toHaveCount(30);
 await expect(page.locator('#recovery-grid [data-copy]')).toHaveCount(30);
 await expect(page.locator('#recovery-videos')).toBeVisible();
 await expect(page.locator('#recovery-video-grid video')).toHaveCount(20);
 await expect(page.locator('#products .product')).toHaveCount(0);
 await expect(page.locator('#recovery-grid .recovery-card').first()).not.toContainText('$');
});
test('category, pending and search filters behave without commercial publishing',async({page})=>{
 await page.goto('/archivo.html');
 await expect(page.locator('#recovery-grid .recovery-card')).toHaveCount(30);
 await page.locator('#recovery-cat [data-filter="Tenis"]').click();
 await expect(page.locator('#recovery-amount')).toContainText('fotografías del archivo');
 await expect(page.locator('#recovery-grid .recovery-pill').first()).toHaveText('Tenis');
 await page.locator('#recovery-cat [data-filter="Pendientes"]').click();
 await expect(page.locator('#recovery-grid .recovery-pill').first()).toHaveText('Por identificar');
 await page.locator('#recovery-search').fill('no-existe-ningún-artículo');
 await expect(page.locator('#recovery-grid .recovery-card')).toHaveCount(0);
 await expect(page.locator('#recovery-status')).toContainText('No hay fotografías');
});
test('mobile pagination and image gallery stay responsive',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/archivo.html');
 await expect(page.locator('#recovery-grid .recovery-card')).toHaveCount(30);
 await page.locator('#recovery-next').click();
 await expect(page.locator('#recovery-page')).toContainText('Página 2');
 await page.locator('#recovery-prev').click();
 await expect(page.locator('#recovery-page')).toContainText('Página 1');
 await expect(page.locator('.hero')).toBeVisible();
});
