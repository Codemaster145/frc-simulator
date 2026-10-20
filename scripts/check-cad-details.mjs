import {testServer} from './test-server.mjs';
const {base,close:closeServer}=await testServer();
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[];
try {
 const page=await browser.newPage({viewport:{width:1000,height:760}});
 await page.addInitScript(()=>localStorage.setItem('chuck-norris-settings-v2',JSON.stringify({quality:'battery'})));
 await page.goto(base);
 await page.waitForFunction(()=>window.__viewer?.state.ready,null,{timeout:180000});
 const result=await page.evaluate(()=>{
  const v=window.__viewer.viewer;v.spinning=false;
  const foam=new Set(v.parts.partsMatching(['Foam']));
  v.setBumperColor('red');
  const snapshots=v.meshes.map(m=>Array.from(m.geometry.getAttribute('color').array));
  v.setBumperColor('blue');
  let changed=0,otherChanged=0;
  v.meshes.forEach((m,k)=>{
   const c=m.geometry.getAttribute('color'),ids=m.geometry.getAttribute('_partid');
   for(let i=0;i<c.count;i++)for(let j=0;j<c.itemSize;j++)if(c.array[i*c.itemSize+j]!==snapshots[k][i*c.itemSize+j]){if(foam.has(ids.getX(i)))changed++;else otherChanged++;}
  });
  v.setBumperColor('red');
  const restored=v.meshes.every((m,k)=>Array.from(m.geometry.getAttribute('color').array).every((c,i)=>c===snapshots[k][i]));
  return {changed,otherChanged,restored,foamParts:foam.size};
 });
 console.log('Bumper color geometry check',result);
 assert.ok(result.changed>0,'The actual CAD Foam bumper changes color');
 assert.equal(result.otherChanged,0,'No non-bumper CAD color changes');
 assert.ok(result.restored,'Red restores the exact original CAD color');
 checks.push('Actual bumper changes color; other CAD colors are unchanged; original restored');
 await page.evaluate(()=>window.__viewer.api.selectSubsystem('indexer'));
 await page.locator('.panel [data-act=isolate]').click();
 assert.ok(await page.evaluate(()=>window.__viewer.viewer.hiddenCount()>0));
 checks.push('Isolate hides other CAD parts');
 await page.evaluate(()=>{window.__viewer.api.showAll();window.__viewer.api.selectSubsystem('intake');});
 await page.locator('.panel [data-act=hide]').click();
 assert.ok(await page.evaluate(()=>window.__viewer.viewer.hiddenCount()>0));
 await page.evaluate(()=>window.__viewer.api.showAll());
 assert.equal(await page.evaluate(()=>window.__viewer.viewer.hiddenCount()),0);
 checks.push('Hide and Show All work on CyberCats parts');
 await page.evaluate(()=>{
  const a=window.__viewer;a.api.overview();a.state.idleReset=true;a.state.lastInteraction=-1e6;
 });
 await page.waitForFunction(()=>window.__viewer.state.pit&&window.__viewer.viewer.showcase,null,{timeout:60000});
 assert.equal(await page.evaluate(()=>window.__viewer.stats().parts),2269);
 await page.screenshot({path:'test-results/cybercats/presentation.png',timeout:180000});
 await page.mouse.click(12,12);
 assert.ok(await page.evaluate(()=>!window.__viewer.state.pit));
 checks.push('Presentation mode spotlights the actual CAD and wakes on input');
 fs.writeFileSync('test-results/cybercats/details-results.json',JSON.stringify({checks,result},null,2));
 console.log('PASS',checks);
} finally {await browser.close();await closeServer();}
