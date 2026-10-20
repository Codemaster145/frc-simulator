import {testServer} from './test-server.mjs';
const {base,close:closeServer}=await testServer();
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[],errors=[];let collection,worker;
try{
 for(const local of [true,false]){
  const page=await browser.newPage({viewport:{width:1000,height:760},serviceWorkers:'block'});
  page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(local=>{
   window.__simLocal=local;
   localStorage.setItem('chuck-norris-settings-v2',JSON.stringify({quality:'battery',autoSpin:false,pitMode:0}));
  },local);
  await page.goto(base);
  await page.waitForFunction(()=>window.__viewer?.state.ready,null,{timeout:180000});
  await page.locator('.dock .tool').filter({hasText:'Simulate'}).click();
  await page.waitForFunction(()=>window.__viewer.state.sim?.active&&window.__viewer.state.sim.backend?.frame,null,{timeout:180000});
  assert.match(await page.locator('.sim-physics-note').innerText(),/Uncalibrated demo physics/);
  if(local){
   const start=await page.evaluate(()=>{
    const a=window.__viewer,s=a.state.sim,w=s.world;
    // Open alliance carpet, away from the TOWER footprint at the center of the wall.
    w.takeOver();w.robot.place(-6.1,-1.5,-Math.PI/2);
    for(let i=0;i<w.fuel.n;i++)w.fuel.park(i,[20,0,i*.01]);
    for(let i=0;i<30;i++)s.frame(1/60);
    a.viewer.root.updateMatrixWorld(true);
    return {x:w.robot.x,front:new a.THREE.Vector3(0,0,1).transformDirection(a.viewer.root.matrixWorld).toArray(),rootQ:a.viewer.root.quaternion.toArray(),stageQ:a.viewer.stage.quaternion.toArray(),bodyQ:w.robot.body.rotation(),heading:w.robot.th};
   });
   console.log('Keyboard orientation fixture',JSON.stringify(start));
   assert.ok(start.front[0]>.99,'Confirmed front faces +field X when the intake faces rearward');
   await page.keyboard.down('w');
   await page.evaluate(()=>{for(let i=0;i<60;i++)window.__viewer.state.sim.frame(1/60);});
   await page.keyboard.up('w');
   const endX=await page.evaluate(()=>window.__viewer.state.sim.world.robot.x);
   assert.ok(endX-start.x>.8,'W drives field-forward with the real front orientation');
   checks.push('Original W key drives field-forward; confirmed CAD front faces the commanded direction');
   collection=await page.evaluate(()=>{
    const sim=window.__viewer.state.sim,w=sim.world,r=w.robot;
    w.takeOver();r.place(-6,0,Math.PI/2);r.setIntakeNow(true);r.rollers='in';
    for(let i=0;i<w.fuel.n;i++)w.fuel.park(i,[20,0,i*.01]);
    const caught=[];const old=r.onIntake;r.onIntake=i=>{caught.push(i);old?.(i);};
    const start=r.toWorld(0,.10,.64);w.fuel.place(0,start);
    for(let i=0;i<120;i++)sim.frame(1/60);
    const root=window.__viewer.viewer.root,T=window.__viewer.THREE;
    const modelCOM=new T.Vector3(.002978917183838213,.17810472235098085,-.09126917838400778).applyQuaternion(root.quaternion);
    const bodyCOM=r.body.localCom();
    return {caught,load:r.load,captured:r.captured.length,ball:Array.from(w.fuel.pos.slice(0,3)),mass:r.body.mass(),com:bodyCOM,parts:window.__viewer.stats().parts,forwardBody:new T.Vector3(0,0,1).applyQuaternion(root.quaternion).toArray(),comFrameError:modelCOM.distanceTo(new T.Vector3(bodyCOM.x,bodyCOM.y,bodyCOM.z))};
   });
   assert.ok(collection.caught.includes(0),'A floor FUEL ball is collected through the original intake physics');
   assert.ok(Math.abs(collection.mass-56.381531591)<.001);
   assert.equal(collection.parts,2269);
   assert.ok(collection.forwardBody[2]<-.99,'Confirmed front is opposite the demo intake-facing body axis');
   assert.ok(collection.comFrameError<1e-5,'Rendered CAD and physics COM use the same frame');
   checks.push('Actual CAD is present in simulation; approved CAD mass reaches Rapier; floor FUEL is collected');
  }else{
   await page.waitForFunction(()=>window.__viewer.state.sim.f.clock>.5,null,{timeout:60000});
   worker=await page.evaluate(()=>{const s=window.__viewer.state.sim;return {clock:s.f.clock,isWorker:!s.world,status:s.status(),parts:window.__viewer.stats().parts,fps:window.__viewer.viewer.stats.fps};});
   assert.ok(worker.isWorker&&worker.clock>.5&&worker.parts===2269);
   checks.push('Default worker simulation advances with the actual CAD');
   await page.evaluate(()=>{
    const s=window.__viewer.state.sim;s.setView('follow');
    // Settle the camera before a still capture even on a slow software renderer.
    for(let i=0;i<90;i++)s.frame(1/60);
   });
   await page.waitForTimeout(2000);
   await page.screenshot({path:'test-results/cybercats/playable-simulation.png',timeout:180000});
   await page.setViewportSize({width:390,height:844});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.screenshot({path:'test-results/cybercats/mobile-simulation.png',timeout:180000});
   checks.push('Mobile simulation viewport has no horizontal page overflow');
  }
  await page.locator('.sim-hud [data-act=exit]').click();
  assert.ok(await page.evaluate(()=>!window.__viewer.state.sim));
  assert.ok(await page.evaluate(()=>Math.abs(window.__viewer.viewer.root.rotation.y)<1e-6),'Exit restores the canonical CAD orientation');
  await page.close();
 }
 assert.deepEqual(errors,[]);checks.push('No page errors; Exit returns to the viewer');
 console.log('PASS',JSON.stringify({checks,collection,worker}));
}finally{fs.writeFileSync('test-results/cybercats/gameplay-integration.json',JSON.stringify({checks,collection,worker,errors},null,2));await browser.close();await closeServer();}
