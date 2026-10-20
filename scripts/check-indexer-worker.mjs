import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const result={errors:[]};
try{
 const page=await browser.newPage({viewport:{width:1100,height:820},serviceWorkers:'block'});
 page.on('pageerror',e=>result.errors.push(String(e)));
 await page.addInitScript(()=>localStorage.setItem('chuck-norris-settings-v2',JSON.stringify({quality:'battery',autoSpin:false,pitMode:0})));
 await page.goto('http://127.0.0.1:5187/');await page.waitForFunction(()=>window.__viewer?.state.ready,null,{timeout:180000});
 await page.locator('.dock .tool').filter({hasText:'Simulate'}).click();
 await page.waitForFunction(()=>window.__viewer.state.sim?.backend?.frame?.robot.indexerPhase>0,null,{timeout:180000});
 result.worker=await page.evaluate(async()=>{
  const {viewer:v,state:s,THREE:T}=window.__viewer,sim=s.sim;
  const {CAD_MOTIONS}=await import('/src/cad-motions.ts');const m=CAD_MOTIONS.find(m=>m.id==='dye-driven');
  // Present and compare the same snapshot, without yielding to a worker update in between.
  sim.present(1);
  const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),-sim.f.robot.indexerPhase*m.drive.ratio);
  return {backend:sim.backend.constructor.name,phase:sim.f.robot.indexerPhase,maxPoseError:Math.max(...v.mechanisms.get('dye-driven').nodes.map(n=>n.node.quaternion.angleTo(q)))};
 });
 assert.equal(result.worker.backend,'WorkerBackend');assert.ok(result.worker.phase>0&&result.worker.maxPoseError<1e-6);assert.deepEqual(result.errors,[]);
 console.log('PASS',JSON.stringify(result));
}finally{fs.writeFileSync('test-results/cybercats/indexer-worker-browser.json',JSON.stringify(result,null,2));await browser.close();}
