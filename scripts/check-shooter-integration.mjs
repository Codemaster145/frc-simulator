import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[],errors=[];let results={};
try{
 for(const local of [true,false]){
  const page=await browser.newPage({viewport:{width:1100,height:820},serviceWorkers:'block'});
  page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(local=>{window.__simLocal=local;localStorage.setItem('chuck-norris-settings-v2',JSON.stringify({quality:'battery',autoSpin:false,pitMode:0,simView:'follow'}));},local);
  await page.goto('http://127.0.0.1:5187/?debug=mechanisms');await page.waitForFunction(()=>window.__viewer?.state.ready,null,{timeout:180000});
  if(local){
   await page.evaluate(()=>window.__viewer.api.selectSubsystem('intake'));
   await page.locator('.panel [data-mech=intake] [data-deg="74"]').click();
   await page.waitForFunction(()=>Math.abs(window.__viewer.viewer.mechanisms.get('intake').angle.value-74*Math.PI/180)<.001,null,{timeout:90000});
   await page.locator('.panel [data-mech=intake] [data-deg="0"]').click();
   await page.waitForFunction(()=>Math.abs(window.__viewer.viewer.mechanisms.get('intake').angle.value)<.001,null,{timeout:90000});
   checks.push('Viewer intake presets smoothly retract to the estimated 74 degrees and deploy to zero');
   await page.evaluate(()=>window.__viewer.api.overview());
   results.viewer=await page.evaluate(async()=>{
    const {viewer:v,THREE:T,state:s}=window.__viewer;s.autoSpin=false;s.idleReset=false;v.spinning=false;
    const {ptooeyPose,REST_PITCH}=await import('/src/ptooey-geometry.ts');
    const center=pids=>v.boxOfParts(pids,false).getCenter(new T.Vector3());
    const fixed=center([2021]),camera=center([2160]),m=center([2082,2090,2145]);const samples=[];
    for(const pitch of [50,70]){
     v.setMechanismNow('ptooey-hood',pitch-REST_PITCH*180/Math.PI);v.syncPose();
     const actual=center([2006,2036,2058,2081]),expected=new T.Vector3(...ptooeyPose(0,pitch*Math.PI/180).upper);
     samples.push({pitch,upperError:actual.distanceTo(expected),fixedError:center([2021]).distanceTo(fixed),cameraError:center([2160]).distanceTo(camera),mainError:center([2082,2090,2145]).distanceTo(m)});
    }
    v.setMechanismNow('ptooey-hood',0);v.syncPose();return samples;
   });
   for(const s of results.viewer){assert.ok(s.upperError<.001,`Upper bank axis aligned ${s.upperError}`);assert.ok(s.fixedError<1e-6&&s.cameraError<1e-6&&s.mainError<1e-6);}
   checks.push('Actual upper roller bank follows the M-axis hood pivot within 1 mm; outer plates, main shaft and camera stay fixed relative to turret during elevation');
  }
  await page.locator('.dock .tool').filter({hasText:'Simulate'}).click();await page.waitForFunction(()=>window.__viewer.state.sim?.active&&window.__viewer.state.sim.backend?.frame,null,{timeout:180000});
  if(local)await page.evaluate(()=>{const s=window.__viewer.state.sim,w=s.world;w.takeOver();w.robot.place(-6.1,-1.5,Math.PI/2);w.robot.setIntakeNow(true);w.robot.preload(w.preloadIdx);for(let i=0;i<60;i++)s.frame(1/60);});
  await page.locator('.sim-hood-controls summary').click();await page.locator('[data-hood=manual]').check();
  await page.locator('[data-hood=angle]').fill('50');
  if(local)await page.evaluate(()=>{for(let i=0;i<90;i++)window.__viewer.state.sim.frame(1/60);});
  await page.waitForFunction(()=>{const h=window.__viewer.state.sim.f.status.shooter;return h?.manual&&Math.abs(h.currentDegrees-50)<.05;},null,{timeout:90000});
  assert.match(await page.locator('.sim-hood-readout').innerText(),/50.0°.*Manual/);
  await page.locator('[data-hood=angle]').fill('70');
  if(local)await page.evaluate(()=>{for(let i=0;i<90;i++)window.__viewer.state.sim.frame(1/60);});
  await page.waitForFunction(()=>Math.abs(window.__viewer.state.sim.f.status.shooter.currentDegrees-70)<.05,null,{timeout:90000});
  await page.locator('[data-hood=manual]').uncheck();
  if(local)await page.evaluate(()=>{for(let i=0;i<90;i++)window.__viewer.state.sim.frame(1/60);});
  await page.waitForFunction(()=>!window.__viewer.state.sim.f.status.shooter.manual,null,{timeout:60000});
  checks.push(`${local?'Local':'Worker'} simulation: HUD manual override reaches 50° and 70°, then returns to automatic distance aiming`);
  if(local){
   await page.locator('.sim-hood-controls summary').click();await page.locator('[data-hood=manual]').blur();
   await page.keyboard.down('Space');
   results.gameplay=await page.evaluate(async()=>{
    const a=window.__viewer,s=a.state.sim,w=s.world,r=w.robot,v=a.viewer,T=a.THREE;
    r.rollers='in';
    const start={shots:r.shotsFired,score:w.scored,phase:r.indexerPhase};
    for(let i=0;i<300;i++)s.frame(1/60);
    s.present(1);v.root.updateMatrixWorld(true);
    const {ptooeyPose}=await import('/src/ptooey-geometry.ts');const t=r.turrets[0],p=ptooeyPose(t.a,t.hood);
    const rendered=new T.Vector3(...p.origin).applyMatrix4(v.root.matrixWorld),ray=r.shotRay(t);
    const mechs={};for(const id of ['ptooey-turret','ptooey-hood','ptooey-flywheel','ptooey-upper','dye-drive','dye-driven'])mechs[id]=v.mechanisms.get(id)?.nodes.map(n=>n.node.quaternion.toArray());
    const phase=r.intakeRollerPhase,roller=v.mechanisms.get('intake-rollers').node.quaternion;
    const expected=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-phase);
    return {shots:r.shotsFired-start.shots,score:w.scored-start.score,indexerDelta:r.indexerPhase-start.phase,originError:rendered.distanceTo(new T.Vector3(...ray.origin)),turrets:r.turrets.length,hood:w.status().shooter,mechs,intakeRollerPhase:phase,intakeRollerError:roller.angleTo(expected)};
   });
   await page.keyboard.up('Space');await page.evaluate(()=>{for(let i=0;i<180;i++)window.__viewer.state.sim.frame(1/60);});
   assert.ok(results.gameplay.shots>0&&results.gameplay.score>0);assert.equal(results.gameplay.turrets,1);assert.ok(results.gameplay.originError<1e-5);assert.ok(results.gameplay.indexerDelta>0);
   assert.ok(results.gameplay.intakeRollerPhase>0&&results.gameplay.intakeRollerError<1e-6);checks.push('Original intake roller CAD spins with the physical demo phase in the inward collection direction');
   checks.push('Space launches and scores FUEL through one outlet; rendered CAD release matches physics world position, and indexer/flywheel phases advance');
   await page.screenshot({path:'docs/mechanism-review/single-outlet-simulation.png',timeout:180000});
  }else{
   await page.setViewportSize({width:1024,height:1366});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   checks.push('iPad portrait viewport keeps hood controls and readouts inside the page');
  }
  await page.locator('.sim-hud [data-act=exit]').click();assert.ok(await page.evaluate(()=>!window.__viewer.state.sim));await page.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS',JSON.stringify({checks,results}));
}finally{fs.writeFileSync('test-results/cybercats/shooter-integration.json',JSON.stringify({checks,results,errors},null,2));await browser.close();}
