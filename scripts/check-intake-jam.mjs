import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {testServer} from './test-server.mjs';

const out='test-results/intake-jam';fs.mkdirSync(out,{recursive:true});
let dev=null;
const devBase='http://127.0.0.1:5187/';
try{await fetch(devBase);}catch{
 dev=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5187','--strictPort'],{cwd:process.cwd(),windowsHide:true,stdio:'ignore'});
 for(let i=0;i<100;i++){try{if((await fetch(devBase)).ok)break;}catch{}await delay(100);}
}
const {base:preview,close:closePreview}=await testServer();
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];
const keys={mx:0,mz:0,turn:0,shoot:false,intake:false,eject:false,lock:false,slow:false,toggleArm:false,toggleIntake:false,handBack:false};
try{
 for(const [label,base] of [['dev',devBase],['production-build',preview]]){
  const page=await browser.newPage({viewport:{width:1280,height:800},serviceWorkers:'block'});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>localStorage.setItem('chuck-norris-settings-v2',JSON.stringify({quality:'battery',autoSpin:false,pitMode:0})));
  await page.goto(`${base}?physics=main&debug=physics`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.__viewer?.state.ready,null,{timeout:180000});
  await page.locator('.dock .tool').filter({hasText:'Simulate'}).click();
  await page.waitForFunction(()=>window.__viewer.state.sim?.active&&window.__viewer.state.sim.world,null,{timeout:180000});
  const initial=await page.evaluate(()=>{const w=window.__viewer.state.sim.world;return {load:w.robot.load,capacity:w.robot.capacity,angle:w.robot.intakeAngle};});
  assert.equal(initial.load,0);assert.equal(initial.capacity,4);assert.ok(initial.angle>70&&initial.angle<=74);
  const outcome=await page.evaluate(keys=>{
   const a=window.__viewer,s=a.state.sim,w=s.world,r=w.robot,f=w.fuel;
   for(let i=0;i<60;i++)w.step(keys);
   assertState(r.intakeAngle===0&&r.rollers==='in','automatic half-second deployment');
   w.takeOver();for(let i=0;i<f.n;i++)f.park(i,[20,0,i*.01]);
   r.place(-6,-1.5,0);r.setIntakeNow(true);r.rollers='in';
   for(let i=0;i<24;i++)f.place(i,r.toWorld((i%6-2.5)*.15,.077,.82+Math.floor(i/6)*.15));
   f.syncAll();let accepted=0,shots=0;const oldShot=r.onShot;r.onIntake=()=>accepted++;r.onShot=(i,side)=>{oldShot?.(i,side);shots++;};
   let peak=0;for(let i=0;i<240;i++){w.step({...keys,mz:1});peak=Math.max(peak,r.load);}
   const filled={accepted,peak,load:r.load,status:w.status(),free:f.st.slice(0,24)};
   s.backend.tick(0,keys);a.ui.simStatus(w.status());for(let i=0;i<6;i++)s.frame(0);
   const readout=document.querySelector('.sim-intake-readout')?.textContent??'';
   const scoreUnit=document.querySelector('.sim-unit')?.textContent??'';
   const debug=document.querySelector('.sim-debug')?.textContent??'';
   let score=0;for(let i=0;i<1200;i++){w.step({...keys,shoot:true});peak=Math.max(peak,r.load);score=Math.max(score,w.scored);}
   s.backend.tick(0,keys);a.ui.simStatus(w.status());s.frame(0);
   const after={accepted,shots,peak,load:r.load,score,status:w.status()};
   s.backend.setMode('free');
   const restart={load:s.world.robot.load,capacity:s.world.robot.capacity,angle:s.world.robot.intakeAngle};
   function assertState(ok,msg){if(!ok)throw new Error(msg);}
   return {filled,after,restart,readout,scoreUnit,debug};
  },keys);
  assert.equal(outcome.filled.peak,4);
  assert.equal(outcome.filled.load,4);
  assert.equal(outcome.filled.accepted,4);
  assert.equal(outcome.filled.status.intakeFlow.full,true);
  assert.match(outcome.readout,/Stored 4\/4/);
  assert.match(outcome.scoreUnit,/scored/i);
  assert.match(outcome.debug,/intake .*FUEL/);
  assert.ok(outcome.after.shots>=4);
  assert.ok(outcome.after.accepted>4,'space freed by shooting collects more FUEL');
  assert.ok(outcome.after.peak<=4);
  assert.deepEqual(outcome.restart,{load:0,capacity:4,angle:74});
  assert.deepEqual(errors,[]);
  await page.screenshot({path:`${out}/${label}.png`,timeout:180000});
  results.push({label,base,initial,outcome:{filled:{accepted:outcome.filled.accepted,load:outcome.filled.load},after:outcome.after,restart:outcome.restart},errors});
  console.log('PASS',label,'empty start, dense pile, four-FUEL cap, refill, shooting, restart, HUD and debug');
  await page.close();
 }
 fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));
}finally{await browser.close();await closePreview();if(dev)dev.kill();}
