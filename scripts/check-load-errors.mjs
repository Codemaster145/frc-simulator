import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 for(const target of ['model','metadata','invalid-metadata']){
  const page=await browser.newPage({serviceWorkers:'block'});
  const route=target==='model'?'**/models/cybercats.glb':'**/models/cybercats.parts.json';
  await page.route(route,r=>r.fulfill({status:target==='invalid-metadata'?200:404,body:target==='invalid-metadata'?'invalid JSON':'missing'}));
  await page.goto(process.env.CYBERCATS_TEST_URL??'http://127.0.0.1:5187/');
  await page.locator('.loader .err').waitFor({state:'visible',timeout:60000});
  assert.ok(await page.evaluate(()=>!window.__viewer?.state.ready));
  console.log('PASS',target,'failure is visible and cannot enter ready/simulation state');
  await page.close();
 }
}finally{await browser.close();}
