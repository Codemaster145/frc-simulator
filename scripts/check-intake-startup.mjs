import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const result={checks:[],errors:[]};
try{
 for(const local of [true,false]){
  const page=await browser.newPage({viewport:{width:1100,height:820},serviceWorkers:'block'});
  page.on('pageerror',e=>result.errors.push(String(e)));
  await page.addInitScript(local=>{window.__simLocal=local;localStorage.setItem('chuck-norris-settings-v2',JSON.stringify({quality:'battery',autoSpin:false,pitMode:0}));},local);
  await page.goto('http://127.0.0.1:5187/');await page.waitForFunction(()=>window.__viewer?.state.ready,null,{timeout:180000});
  await page.evaluate(()=>{
   const v=window.__viewer.viewer,original=v.setMechanismNow.bind(v);
   window.__intakeRenderedAngles=[];
   v.setMechanismNow=(id,degrees)=>{if(id==='intake')window.__intakeRenderedAngles.push(degrees);return original(id,degrees);};
  });
  await page.locator('.dock .tool').filter({hasText:'Simulate'}).click();
  await page.waitForFunction(()=>window.__viewer.state.sim?.active&&window.__viewer.state.sim.backend?.frame,null,{timeout:180000});
  await page.waitForFunction(()=>window.__viewer.state.sim.backend.frame.robot.intakeAngle===0,null,{timeout:90000});
  const entering=await page.evaluate(()=>window.__intakeRenderedAngles);
  assert.ok(entering.includes(74)&&entering.slice(entering.indexOf(74)+1).includes(0),JSON.stringify(entering.slice(0,12)));
  const r=await page.evaluate(()=>{
   const s=window.__viewer.state.sim,v=window.__viewer.viewer;
   if(s.backend.constructor.name==='WorkerBackend'){
    window.__intakeStartupFrames=[];
    s.backend.worker.addEventListener('message',e=>{if(e.data.frame)window.__intakeStartupFrames.push(e.data.frame.robot.intakeAngle);});
   }
   s.restart();
   return {firstRendered:v.mechanismValue('intake'),firstFrame:s.backend.frame.robot.intakeAngle,backend:s.backend.constructor.name};
  });
  assert.ok(Math.abs(r.firstRendered-74)<1e-6,JSON.stringify(r));
  if(local)assert.equal(r.firstFrame,74);
  else await page.waitForFunction(()=>window.__intakeStartupFrames?.includes(74),null,{timeout:90000});
  await page.waitForFunction(()=>window.__viewer.state.sim.backend.frame.robot.intakeAngle===0,null,{timeout:90000});
  const d=await page.evaluate(()=>{const s=window.__viewer.state.sim;s.present(1);return {angle:s.backend.frame.robot.intakeAngle,rendered:window.__viewer.viewer.mechanismValue('intake'),target:s.backend.frame.status.intake?.targetDegrees};});
  assert.equal(d.angle,0);assert.equal(d.rendered,0);assert.equal(d.target,0);
  if(!local)assert.ok(await page.evaluate(()=>window.__intakeStartupFrames.includes(74)), 'worker must publish the raised startup frame');
  result.checks.push(`${r.backend}: entering Simulate and restarting both render 74°, then snap to 0° without an actuator animation`);
  await page.close();
 }
 assert.deepEqual(result.errors,[]);console.log('PASS',JSON.stringify(result));
}finally{fs.writeFileSync('test-results/cybercats/intake-startup-browser.json',JSON.stringify(result,null,2));await browser.close();}
