const {test,expect}=require('@playwright/test');

test('Studio loads real ImageKit archive, free AI suggestions and mobile filtering',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/studio.html');
 await expect(page).toHaveTitle(/Elegance Studio/);
 await expect(page.locator('#stat-total')).toHaveText('3,909');
 await expect(page.locator('#stat-ai')).not.toHaveText('—');
 await expect(page.locator('#ai-progress-title')).toContainText('fotografías analizadas por IA');
 await expect(page.locator('#ai-progress-detail')).toContainText('ubicadas automáticamente');
 const percent=Number(await page.locator('#ai-progress-bar').getAttribute('aria-valuenow'));
 expect(percent).toBeGreaterThan(0);
 expect(percent).toBeLessThanOrEqual(100);
 await expect(page.getByText('No necesitas aprobar foto por foto.')).toBeVisible();
 await expect(page.locator('#studio-grid .photo-card')).toHaveCount(36);
 await expect(page.locator('#stat-edits')).toHaveText('0');
 await page.selectOption('#studio-status','pending');
 await expect(page.locator('#studio-grid .photo-card').first()).toBeVisible();
 await page.selectOption('#studio-status','reviewed');
 await expect(page.locator('#studio-empty')).toBeVisible();
 await page.selectOption('#studio-status','ai');
 await expect(page.locator('#studio-grid .photo-card').first()).toBeVisible();
 await page.locator('#studio-reset').click();
 await expect(page.locator('#studio-grid .photo-card')).toHaveCount(36);
 await page.screenshot({path:'test-results/elegance-studio-phone.png'});
});
test('Studio edits, groups, persists drafts and prepares secure owner GitHub submission',async({page})=>{
 await page.goto('/studio.html');
 await expect(page.locator('#studio-grid .photo-card')).toHaveCount(36);
 const ids=await page.locator('#studio-grid .photo-card').evaluateAll(x=>x.slice(0,2).map(y=>y.dataset.id));
 await page.locator('#studio-grid .photo-card').first().locator('.select').click();
 await page.locator('#studio-grid .photo-card').nth(1).locator('.select').click();
 await expect(page.locator('#selection-count')).toContainText('2 seleccionadas');
 await page.locator('#group-selected').click();
 await expect(page.locator('#stat-edits')).toHaveText('2');
 await page.locator('#studio-grid .photo-card').first().locator('[data-edit]').first().click();
 await expect(page.locator('#studio-edit')).toBeVisible();
 await page.selectOption('#edit-category','Tenis');
 await page.locator('#edit-name').fill('Tenis negros, edición de prueba');
 await page.locator('#edit-reviewed').check();
 await page.locator('#studio-edit-form button[type=submit]').click();
 await expect(page.locator('#studio-edit')).toBeHidden();
 await expect(page.locator('#stat-edits')).toHaveText('2');
 await page.reload();
 await expect(page.locator('#stat-edits')).toHaveText('2');
 const saved=await page.evaluate(ids=>{const drafts=JSON.parse(localStorage.getItem('elegance_studio_drafts_v1'));return ids.map(id=>drafts[id])},ids);
 expect(saved[0].name).toBe('Tenis negros, edición de prueba');
 expect(saved[0].category).toBe('Tenis');
 expect(saved[0].reviewed).toBe(true);
 expect(saved[0].groupId).toBe(ids[0]);
 expect(saved[1].groupId).toBe(ids[0]);
 await page.evaluate(()=>{window.open=(url)=>{window.__githubIssueUrl=url;return null}});
 await page.locator('#studio-publish').click();
 const issue=await page.evaluate(()=>window.__githubIssueUrl);
 expect(issue).toContain('/issues/new?title=');
 const body=new URL(issue).searchParams.get('body');
 expect(body).toContain('ELEGANCE_STUDIO_V1');
 const changes=JSON.parse(body.split('\n').slice(1).join('\n')).changes;
 expect(changes).toHaveLength(2);
 expect(changes.some(x=>x.category==='Tenis')).toBe(true);
 expect(changes.every(x=>!('price' in x||'stock' in x))).toBe(true);
});
test('Published Studio curation hides grouped photos and changes product title/category',async({page})=>{
 await page.goto('/');
 const data=await page.evaluate(async()=> (await(await fetch('data/imagekit-media.json')).json())
   .filter(x=>x.mime.startsWith('image/')).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,3));
 const [a,b,c]=data;
 await page.route('**/data/catalog-curation.json',route=>route.fulfill({status:200,contentType:'application/json',
  body:JSON.stringify({version:1,entries:{
    [a.fileId]:{name:'Tenis aprobados por Studio',category:'Tenis',reviewed:true,groupId:a.fileId},
    [b.fileId]:{name:'Vista secundaria',groupId:a.fileId},
    [c.fileId]:{hidden:true}
  }})
 }));
 await page.reload();
 await expect(page.locator('#product-grid .catalog-card')).toHaveCount(30);
 await expect(page.locator('#product-grid .card-title').first()).toContainText('Tenis aprobados por Studio');
 await page.locator('#product-grid [data-open]').first().click();
 await expect(page.locator('#item-dialog')).toBeVisible();
 await expect(page.locator('#item-detail .detail-gallery button')).toHaveCount(2);
 await expect(page.locator('#item-dialog')).not.toContainText('$');
});
