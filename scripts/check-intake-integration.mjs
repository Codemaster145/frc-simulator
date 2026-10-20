import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[],errors=[],results={};
try{
 for(const local of [true,false]){
  const page=await browser.newPage({viewport:{width:1100,height:820},serviceWorkers:'block'});
  page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(local=>{window.__simLocal=local;localStorage.setItem('chuck-norris-settings-v2',JSON.stringify({quality:'battery',autoSpin:false,pitMode:0,simView:'follow'}));},local);
  await page.goto('http://127.0.0.1:5187/');await page.waitForFunction(()=>window.__viewer?.state.ready,null,{timeout:180000});
  if(local){
   results.viewer=await page.evaluate(async()=>{
    const {viewer:v,state:s,THREE:T}=window.__viewer;s.autoSpin=false;s.idleReset=false;v.spinning=false;
    const {intakePose,moveIntakePoint}=await import('/src/intake-linkage.ts');
    const groups=(await import('/src/intake-groups.json')).default;
    const sample=id=>{for(const m of v.meshes){const ids=m.geometry.getAttribute('_partid');for(let i=0;i<ids.count;i++)if(ids.getX(i)===id){return {m,i,point:()=>new T.Vector3().fromBufferAttribute(m.geometry.attributes.position,i).applyMatrix4(m.matrixWorld).applyMatrix4(v.root.matrixWorld.clone().invert())};}}};
    v.setMechanismNow('intake',0);v.syncPose();
    const chosen=[...['upper','lower','coupler','pin'].flatMap(k=>groups[k].map(id=>({id,body:k}))),...[1106,1119,1201,1208,714,720,734,747,756,774].map(id=>({id,body:null}))].map(o=>({...o,sample:sample(o.id)}));
    for(const o of chosen)o.rest=o.sample.point().toArray();
    const samples=[];
    for(const degrees of [0,18,37,56,74,37,0]){
     v.setMechanismNow('intake',degrees);v.syncPose();const pose=intakePose(degrees);let error=0;
     for(const o of chosen){const expected=o.body?moveIntakePoint(o.rest,pose[o.body]):o.rest;error=Math.max(error,o.sample.point().distanceTo(new T.Vector3(...expected)));}
     samples.push({degrees,error});
    }
    const triangles=()=>v.meshes.reduce((n,m)=>n+(m.geometry.index?.count??m.geometry.attributes.position.count)/3,0);
    return {samples,parts:v.parts.count,triangles:triangles(),sampledParts:chosen.length};
   });
   assert.equal(results.viewer.parts,2269);assert.equal(results.viewer.triangles,1141549);
   assert.ok(results.viewer.samples.every(s=>s.error<1e-6));
   checks.push('All assigned intake parts follow the measured four-bar and pin-slot transforms at 0/18/37/56/74 degrees and back; housings remain fixed; 2269 parts and 1141549 triangles preserved');
   for(const degrees of [0,37,74]){
    await page.evaluate(degrees=>{const {viewer:v,api,THREE:T}=window.__viewer;api.overview();v.showAll();v.setFocus(null);v.setMechanismNow('intake',degrees);v.syncPose();v.controls.setLookAt(-1.7,1.05,-1.8,0,.32,-.15,false);v.settle();v.dirty=true;
     let label=document.getElementById('intake-review-caption');if(!label){label=document.createElement('div');label.id='intake-review-caption';label.style.cssText='position:fixed;bottom:100px;left:20px;padding:12px;background:#132234ef;color:white;font:16px system-ui;pointer-events:none;z-index:500';document.body.append(label);}label.textContent=`Arthritis actual CAD: ${degrees}° upper Driver-arm rotation · 74° is an estimated stowed limit`;
    },degrees);
    await page.screenshot({path:`docs/mechanism-review/intake-${degrees}.png`,timeout:180000});
   }
   await page.evaluate(()=>{document.getElementById('intake-review-caption')?.remove();window.__viewer.viewer.setMechanismNow('intake',0);});
  }
  await page.locator('.dock .tool').filter({hasText:'Simulate'}).click();await page.waitForFunction(()=>window.__viewer.state.sim?.active&&window.__viewer.state.sim.backend?.frame,null,{timeout:180000});
  const advance=async()=>{if(local)await page.evaluate(()=>{for(let i=0;i<150;i++)window.__viewer.state.sim.frame(1/60);});};
  await page.locator('[data-intake=retract]').click();await advance();
  await page.waitForFunction(()=>Math.abs(window.__viewer.state.sim.f.robot.intakeAngle-74)<.01,null,{timeout:90000});
  checks.push(`${local?'Local':'Worker'} Retract reaches estimated 74 degrees through the UI`);
  if(local)await page.screenshot({path:'docs/mechanism-review/intake-stowed-simulation.png',timeout:180000});
  await page.locator('[data-intake=deploy]').click();await advance();
  await page.waitForFunction(()=>window.__viewer.state.sim.f.robot.intakeAngle<.01,null,{timeout:90000});
  await page.locator('[data-intake=toggle]').click();await advance();
  await page.waitForFunction(()=>Math.abs(window.__viewer.state.sim.f.robot.intakeAngle-74)<.01,null,{timeout:90000});
  checks.push(`${local?'Local':'Worker'} Deploy returns to zero and Toggle retracts`);
  if(local){
   await page.locator('.sim-hud [data-act=settings]').click();
   await page.getByLabel('Estimated intake maximum angle').fill('60');await page.getByLabel('Estimated intake maximum angle').press('Tab');await advance();
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('chuck-norris-settings-v2')).intakeMaximum),60);
   await page.locator('.sheet-head [data-act=close]').click();await advance();
   assert.ok(Math.abs(await page.evaluate(()=>window.__viewer.state.sim.f.robot.intakeAngle)-60)<.01);
   checks.push('Estimated maximum setting persists and changing it lowers smoothly to 60 degrees');
   await page.locator('.sim-exit').click();await page.waitForFunction(()=>!window.__viewer.state.sim);
   const count=await page.evaluate(()=>({parts:window.__viewer.viewer.parts.count,triangles:window.__viewer.viewer.meshes.reduce((n,m)=>n+(m.geometry.index?.count??m.geometry.attributes.position.count)/3,0)}));
   assert.equal(count.parts,2269);assert.equal(count.triangles,1141549);checks.push('Returning to the viewer preserves all CAD geometry');
  }
  await page.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({checks,results,errors},null,2));
 fs.writeFileSync('test-results/cybercats/intake-browser.json',JSON.stringify({checks,results,errors},null,2));
}finally{await browser.close();}
