const {test,expect}=require('@playwright/test');

test('administrator can approve and revoke a visually similar photo pair without changing commercial data',async({page})=>{
 const a='6acadfcbead997d09af5a0db',b='6acfd156ead997d09a86ef7c';
 const ids=['aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'];
 const photoSource=(await(await page.request.get('/data/imagekit-media.json')).json());
 const pics=[a,b].map((id,index)=>({
  id:ids[index],imagekit_file_id:id,url:photoSource.find(x=>x.fileId===id).url,
  mime:'image/webp',filename:'Imagen '+(index+1),title:null,brand:null,
  category:'Tenis',price:null,stock:null,visible:true,group_id:null,ai_status:'pending_review',created_at:'2026-10-20T12:00:00Z'
 }));
 const actions=[];
 await page.addInitScript(()=>{
   sessionStorage.setItem('elegance_admin_auth_v1',JSON.stringify({access_token:'test-session-access',refresh_token:'test-refresh'}));
 });
 await page.route('**/data/visual-relations.json',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({version:1,verified:false,pairs:[{a,b,category:'Tenis',distance:0}]})
 }));
 await page.route('**/functions/v1/elegance-admin',async route=>{
  const request=route.request();
  const body=JSON.parse(request.postData()||'{}');
  actions.push(body);
  if(body.action==='status')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,allowed:true,email:'authorized-test@example.invalid',imagekitReady:true})});
  if(body.action==='list')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,items:pics})});
  if(body.action==='visibility')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,hiddenIds:[],media:[]})});
  if(body.action==='set-group'){
   const original=pics.find(x=>x.id===body.id);
   original.group_id=body.targetFileId;
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,item:{id:body.id,imagekit_file_id:original.imagekit_file_id,group_id:original.group_id}})});
  }
  return route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({ok:false,error:'Unexpected mocked operation'})});
 });
 await page.goto('/');
 await page.locator('#admin-header-open').click();
 await expect(page.locator('#admin-similar-count')).toContainText('2 fotos');
 await page.locator('#admin-similar-only').check();
 const row=page.locator('#admin-media-grid [data-id="'+a+'"]');
 await expect(row).toBeVisible();
 await row.locator('[data-edit-admin]').click();
 const link=page.locator('#admin-media-grid [data-link-admin="'+b+'"]');
 await expect(link).toBeVisible();
 await link.click();
 await expect.poll(()=>actions.some(x=>x.action==='set-group'&&x.targetFileId===b)).toBeTruthy();
 await row.locator('[data-edit-admin]').click();
 await expect(page.locator('#admin-media-grid [data-unlink-admin]')).toBeVisible();
 await page.locator('#admin-media-grid [data-unlink-admin]').dispatchEvent('click'); // DOM refresh can detach the button between pointer frames.
 await expect.poll(()=>actions.some(x=>x.action==='set-group'&&x.targetFileId===null)).toBeTruthy();
 expect(actions.filter(x=>x.action==='update')).toHaveLength(0);
});
