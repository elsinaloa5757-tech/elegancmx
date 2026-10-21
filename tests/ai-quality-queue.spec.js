const {test,expect}=require('@playwright/test');

test('admin review queue prioritizes AI conflicts and owner reference without changing merchandise',async({page})=>{
 const id='6ad86205ead997d09a2accd8';
 const calls=[];
 await page.addInitScript(()=>{
   sessionStorage.setItem('elegance_admin_auth_v1',JSON.stringify({
     access_token:'fixture-session',refresh_token:'fixture-refresh'
   }));
 });
 await page.route('**/data/identification-audit.json',route=>route.fulfill({
   status:200,contentType:'application/json',
   body:JSON.stringify({
      version:1,verified:false,photoCount:3911,unclassified:832,modelConflict:1,
      ownerReviewedCount:2,queue:[{fileId:id,category:'Calzado',visualCategory:'Tenis',
      ownerReferenceCategory:'Tenis',ownerReferenceFileId:'6acadfcbead997d09af5a0db',
      reason:'conflict',priority:0,signals:['model_conflict']}],reviewQueueCount:1
   })
 }));
 await page.route('**/functions/v1/elegance-admin',route=>{
   const data=JSON.parse(route.request().postData()||'{}');
   calls.push(data);
   if(data.action==='status')return route.fulfill({status:200,contentType:'application/json',
     body:JSON.stringify({ok:true,allowed:true,email:'test-user@invalid.test',imagekitReady:true})});
   if(data.action==='list')return route.fulfill({status:200,contentType:'application/json',
     body:JSON.stringify({ok:true,items:[]})});
   return route.fulfill({status:200,contentType:'application/json',
     body:JSON.stringify({ok:true,hiddenIds:[],media:[]})});
 });
 await page.goto('/');
 await page.locator('#admin-header-open').click();
 await expect(page.locator('#admin-ai-audit-summary')).toContainText('832 sin categoría');
 await expect(page.locator('#admin-ai-audit-summary')).toContainText('1 desacuerdos');
 await page.locator('#admin-ai-priority').selectOption('conflict');
 const cards=page.locator('#admin-media-grid .admin-media-card');
 await expect(cards).toHaveCount(1);
 await expect(cards.first()).toHaveAttribute('data-id',id);
 await expect(cards.first()).toContainText('Discrepancia IA');
 await expect(cards.first()).toContainText('Referencia revisada parecida');
 expect(calls.every(x=>x.action!=='update'&&x.action!=='set-group')).toBeTruthy();
});
