const {test,expect}=require('@playwright/test');

test('Open vision proposes a generic name visibly marked unverified without making a sellable product',async({page})=>{
 const id='6ad86205ead997d09a2accd8';
 await page.route('**/data/vision-drafts.json',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify([{fileId:id,nameSuggestion:'Tenis plateados',categorySuggestion:'Tenis',
    visualDescriptionUnverified:'The main fashion product is a shiny silver sneaker.',
    verified:false,status:'requires_review',source:'smolvlm_open_cpu'}])
 }));
 await page.goto('/');
 const proposal=page.locator('#product-grid .catalog-card').filter({hasText:'Tenis plateados'});
 await expect(proposal).toHaveCount(1);
 await expect(proposal).toContainText('Sin verificar');
 await proposal.locator('[data-open]').first().click();
 await expect(page.locator('#item-dialog')).toContainText('Descripción visual propuesta por IA (sin verificar)');
 await expect(page.locator('#item-dialog')).not.toContainText('$');
});

test('Malformed or unapproved vision drafts cannot replace verified owner data',async({page})=>{
 await page.route('**/data/vision-drafts.json',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify([{fileId:'6ad86205ead997d09a2accd8',nameSuggestion:'Nombre no aprobado',
    categorySuggestion:'Tenis',verified:true,status:'requires_review'}])
 }));
 await page.goto('/');
 await expect(page.locator('#product-grid')).not.toContainText('Nombre no aprobado');
});
