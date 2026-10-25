const {test,expect}=require('@playwright/test');
test('real GLB viewer registers, loads skin/animations, and plays roar in browser',async({page})=>{
  test.setTimeout(70000);
  await page.goto('/pantera-3d.html');
  await expect.poll(()=>page.evaluate(()=>Boolean(customElements.get('model-viewer'))),{timeout:25000}).toBeTruthy();
  await expect.poll(()=>page.evaluate(()=>document.querySelector('#panther').loaded),{timeout:30000}).toBeTruthy();
  const clips=await page.evaluate(()=>[...document.querySelector('#panther').availableAnimations]);
  expect(clips).toEqual(expect.arrayContaining(['idle_breathe','roar_short','look_left','look_right','stance_shift']));
  await page.locator('[data-clip="roar_short"]').click();
  await expect.poll(()=>page.evaluate(()=>document.querySelector('#panther').animationName)).toBe('roar_short');
  await page.locator('[data-clip="idle_breathe"]').click();
  await expect.poll(()=>page.evaluate(()=>document.querySelector('#panther').animationName)).toBe('idle_breathe');
});