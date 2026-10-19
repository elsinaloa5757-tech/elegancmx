const {test,expect}=require('@playwright/test');
test('laboratorio IA conserva pantera y no publica sugerencias',async({page})=>{
 await page.goto('/laboratorio-ia.html');
 await expect(page).toHaveTitle(/Laboratorio IA/i);
 await expect(page.locator('.lab-hero')).toBeVisible();
 await expect(page.locator('#export')).toBeVisible();
 await expect(page.locator('#total')).toContainText('3,909');
 await expect(page.locator('#approved')).toContainText('0');
 const n=await page.evaluate(async()=>{const response=await fetch('/data/ai-classifications.json');return (await response.json()).length});
 await expect(page.locator('#cards .lab-card')).toHaveCount(Math.min(n,24));
 await expect(page.locator('#cards .lab-card .chosen')).toHaveCount(0);
});
