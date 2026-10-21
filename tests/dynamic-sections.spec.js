const {test,expect}=require('@playwright/test');

test('dynamic category and previously unknown brand appear in expanded shelves without replacing the original layout',async({page})=>{
 const routes=await(await page.request.get('/data/auto-categories.json')).json();
 const row=routes.find(x=>x.category==='Bolsas'&&!x.legacyReference);
 expect(row).toBeTruthy();
 const id=row.fileId;
 await page.route('**/data/dynamic-sections.json',r=>r.fulfill({status:200,contentType:'application/json',
  body:JSON.stringify({
   version:1,verified:false,
   categories:[{name:'Mochilas',parent:'Bolsas',photoCount:1,ownerSources:0}],
   brands:[{name:'On Running',photoCount:1,ownerSources:0}],
   assignments:[{fileId:id,subCategory:'Mochilas',brand:'On Running',brandEvidence:'clip_logo_candidate',verifiedBrand:false,verifiedCategory:false}]
  })
 }));
 await page.goto('/');
 await expect(page.locator('#category-grid .category-tile')).toHaveCount(6);
 await expect(page.locator('#brand-rail .brand-card')).toHaveCount(7);
 await page.locator('#all-categories').click();
 await expect(page.locator('#category-grid [data-category="Mochilas"]')).toBeVisible();
 await page.locator('#category-grid [data-category="Mochilas"]').click();
 await expect(page.locator('#product-grid [data-open="'+id+'"]').first()).toBeVisible();
 await expect(page.locator('#product-grid .micro-category').first()).toHaveText('Mochilas');
 await page.locator('#clear-filters').click();
 await page.locator('#all-brands').click();
 await expect(page.locator('#brand-rail [data-brand="On Running"]')).toBeVisible();
 await page.locator('#brand-rail [data-brand="On Running"]').click();
 await expect(page.locator('#product-grid [data-open="'+id+'"]').first()).toBeVisible();
 // A brand filter is a provisional visual filing, not proof of the brand.
 await expect(page.locator('#item-detail')).not.toContainText('100% auténtico');
});

test('uncorroborated OCR-only brand cannot create a public brand section',async({page})=>{
 await page.route('**/data/dynamic-sections.json',r=>r.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({version:1,verified:false,
   categories:[],brands:[],assignments:[]})
 }));
 await page.goto('/');
 await page.locator('#all-brands').click();
 await expect(page.locator('#brand-rail [data-brand="MarcaInventadaPorOCR"]')).toHaveCount(0);
});

test('published Cloudflare package includes real current dynamic sections manifest',async({page})=>{
 const r=await page.request.get('/data/dynamic-sections.json');
 expect(r.ok()).toBeTruthy();
 expect(r.headers()['content-type']).toMatch(/json/);
 const data=await r.json();
 expect(data.version).toBe(1);
 expect(data.verified).toBe(false);
 expect(data.photoCount).toBeGreaterThan(3908);
 expect(Array.isArray(data.categories)).toBeTruthy();
 expect(Array.isArray(data.brands)).toBeTruthy();
 expect(Array.isArray(data.assignments)).toBeTruthy();
});
