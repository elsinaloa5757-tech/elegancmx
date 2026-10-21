const {test,expect}=require('@playwright/test');

test('background-generated names appear automatically without opening Lens or clicking the admin',async({page})=>{
 const id='6ad86205ead997d09a2accd8';
 await page.route('**/data/vision-drafts.json',r=>r.fulfill({
  status:200,contentType:'application/json',body:'[]'
 }));
 await page.route('**/data/name-drafts.json',r=>r.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({version:1,verified:false,records:[
    {fileId:id,nameSuggestion:'Tenis plateados',category:'Tenis',verified:false,status:'unverified',method:'visual_description_generic'}
  ],stats:{total:1}})
 }));
 await page.goto('/');
 await expect(page.locator('#product-grid .catalog-card').filter({hasText:'Tenis plateados'})).toHaveCount(1);
 await expect(page.locator('#product-grid')).toContainText('Sin verificar');
});
test('owner-corrected name always outranks automated results',async({page})=>{
 const id='6ad2fc53ead997d09a2d4b15';
 await page.route('**/data/name-drafts.json',r=>r.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({version:1,verified:false,records:[
    {fileId:id,nameSuggestion:'Nombre erróneo generado por IA',category:'Tenis',verified:false,status:'unverified',method:'visual_description_generic'}
  ]})
 }));
 await page.goto('/');
 await expect(page.locator('#product-grid')).not.toContainText('Nombre erróneo generado por IA');
});
