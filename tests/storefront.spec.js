const {test,expect}=require('@playwright/test');
test('storefront preserves original panther and displays recovered gallery',async({page})=>{
 await page.goto('/');
 await expect(page).toHaveTitle(/Elegance MX/i);
 await expect(page.locator('.hero')).toBeVisible();
 await expect(page.locator('#recovery-search')).toBeVisible();
 await expect(page.locator('#recovery-grid .recovery-card')).toHaveCount(30);
 const panther=await page.evaluate(async()=>{const r=await fetch('/assets/elegance-panther.png');return r.ok&&r.headers.get('content-type')?.includes('image')});
 expect(panther).toBeTruthy();
});
test('unverified media never become sellable products',async({page})=>{
 await page.goto('/');
 await expect(page.locator('#products .product')).toHaveCount(0);
 await expect(page.locator('#recovery-grid .recovery-card')).toHaveCount(30);
 await expect(page.locator('#recovery-grid [data-copy]')).toHaveCount(30);
 await expect(page.locator('#checkout')).not.toBeVisible();
});
test('mobile media search is responsive',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await page.locator('#recovery-search').fill('no-existe-ningún-artículo');
 await expect(page.locator('#recovery-grid .recovery-card')).toHaveCount(0);
 await expect(page.locator('.hero')).toBeVisible();
});
