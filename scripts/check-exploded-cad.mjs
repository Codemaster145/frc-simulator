import {testServer} from './test-server.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const {base,close:closeServer}=await testServer();
const out='test-results/exploded-cad';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1,serviceWorkers:'block'});
const errors=[],checks=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const pass=(name)=>{checks.push(name);console.log('PASS',name);};
const read=()=>page.evaluate(()=>{
 const {viewer,THREE}=window.__viewer;
 viewer.root.updateMatrixWorld(true);
 const groups=[...viewer.subs.values()].map(s=>{
  const b=new THREE.Box3().setFromObject(s.group);
  return {id:s.id,min:b.min.toArray(),max:b.max.toArray(),position:s.group.position.toArray(),meshCount:s.meshes.length};
 });
 return {parts:window.__viewer.stats().parts,groups,matrices:viewer.meshes.map(m=>m.matrixWorld.elements.slice()),
  cameraTarget:viewer.controls.getTarget(new THREE.Vector3()).toArray(),explode:viewer.explode.value};
});
const maxMatrixError=(a,b)=>Math.max(...a.matrices.flatMap((m,i)=>m.map((x,j)=>Math.abs(x-b.matrices[i][j]))));
try{
 await page.addInitScript(()=>localStorage.setItem('chuck-norris-settings-v2',JSON.stringify({quality:'battery',autoSpin:false,pitMode:0})));
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>window.__viewer?.state.ready,null,{timeout:180000});
 await page.evaluate(()=>{const a=window.__viewer;a.state.autoSpin=false;a.state.idleReset=false;a.viewer.spinning=false;a.viewer.settle();});
 const assembled=await read();
 assert.equal(assembled.parts,2269);pass('Actual 2,269-part CyberCats CAD loads');
 await page.screenshot({path:`${out}/assembled.png`,timeout:180000});

 await page.getByRole('button',{name:'Explode view',exact:true}).click();
 await page.waitForFunction(()=>window.__viewer.viewer.explode.value>0.05&&window.__viewer.viewer.explode.value<.99,null,{timeout:15000});
 pass('Explode visibly transitions through an intermediate pose');
 await page.evaluate(()=>window.__viewer.viewer.settle());
 const exploded=await read();
 assert.equal(exploded.explode,1);
 assert.ok(exploded.groups.every(g=>g.meshCount>0));
 assert.deepEqual(exploded.groups.map(g=>g.meshCount),assembled.groups.map(g=>g.meshCount));
 const byId=new Map(exploded.groups.map(g=>[g.id,g]));
 const frame=byId.get('frame'),drive=byId.get('swerve'),intake=byId.get('intake'),shooter=byId.get('turrets');
 assert.ok(frame.min[1]-drive.max[1]>.04,'frame clears swerve modules');
 assert.ok(intake.max[0]<frame.min[0]-.08,'intake sits left of chassis');
 assert.ok(shooter.min[0]>frame.max[0]+.08,'shooter sits right of chassis');
 for(let i=0;i<exploded.groups.length;i++)for(let j=i+1;j<exploded.groups.length;j++){
  const a=exploded.groups[i],b=exploded.groups[j];
  const gap=Math.max(...[0,1,2].flatMap(k=>[a.min[k]-b.max[k],b.min[k]-a.max[k]]));
  assert.ok(gap>.04,`${a.id} and ${b.id} assembly boxes intersect`);
 }
 pass('Six complete CAD groups have separated, nonintersecting bounds');
 const all=exploded.groups.reduce((bounds,g)=>{
  for(let k=0;k<3;k++){bounds.min[k]=Math.min(bounds.min[k],g.min[k]);bounds.max[k]=Math.max(bounds.max[k],g.max[k]);}
  return bounds;
 },{min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]});
 const center=all.min.map((x,i)=>(x+all.max[i])/2);
 assert.ok(Math.hypot(...center.map((x,i)=>x-exploded.cameraTarget[i]))<.05);
 pass('Camera targets the full exploded layout');
 await page.screenshot({path:`${out}/exploded.png`,timeout:180000});

 await page.locator('.pin').filter({hasText:'Shooter'}).click();
 assert.equal(await page.evaluate(()=>window.__viewer.state.sel?.id),'turrets');
 assert.deepEqual((await read()).groups.map(g=>g.position),exploded.groups.map(g=>g.position));
 pass('Assembly label selects the shooter without moving any assembly');
 await page.evaluate(()=>window.__viewer.api.overview());
 await page.evaluate(()=>window.__viewer.api.hidePids([23],'Chassis tube'));
 assert.equal(await page.evaluate(()=>window.__viewer.viewer.hiddenCount()),1);
 await page.evaluate(()=>window.__viewer.viewer.showAll());
 assert.equal(await page.evaluate(()=>window.__viewer.viewer.hiddenCount()),0);
 pass('CAD part hiding and showing still works while exploded');

 for(let cycle=0;cycle<3;cycle++){
  await page.getByRole('button',{name:'Collapse exploded view',exact:true}).click();
  await page.evaluate(()=>window.__viewer.viewer.settle());
  const collapsed=await read();
  assert.equal(collapsed.explode,0);
  assert.ok(maxMatrixError(assembled,collapsed)<1e-6,`cycle ${cycle+1} failed to restore CAD transforms`);
  if(cycle<2){
   await page.getByRole('button',{name:'Explode view',exact:true}).click();
   await page.evaluate(()=>window.__viewer.viewer.settle());
   assert.deepEqual((await read()).groups.map(g=>g.position),exploded.groups.map(g=>g.position));
  }
 }
 pass('Three collapse cycles restore every CAD mesh world transform exactly');
 await page.screenshot({path:`${out}/collapsed.png`,timeout:180000});

 await page.getByRole('button',{name:'Explode view',exact:true}).click();
 await page.evaluate(()=>window.__viewer.viewer.settle());
 await page.locator('.dock .tool').filter({hasText:'Simulate'}).click();
 await page.waitForFunction(()=>window.__viewer.state.sim?.active&&window.__viewer.state.sim.backend?.frame,null,{timeout:180000});
 assert.equal(await page.evaluate(()=>window.__viewer.viewer.explode.value),0,'simulation enters with fully collapsed CAD');
 assert.equal(await page.evaluate(()=>window.__viewer.stats().parts),2269);
 assert.equal(await page.evaluate(()=>window.__viewer.state.exploded),false);
 pass('Entering playable Simulation mode collapses the actual CAD');
 await page.screenshot({path:`${out}/simulation.png`,timeout:180000});
 assert.deepEqual(errors,[]);pass('No browser page errors');
 fs.writeFileSync(`${out}/results.json`,JSON.stringify({checks,errors,groups:exploded.groups},null,2));
}finally{await browser.close();await closeServer();}
