import {testServer} from './test-server.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const {base,close}=await testServer();
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const result={directions:{},errors:[]};
try{
 const page=await browser.newPage({viewport:{width:1000,height:760},serviceWorkers:'block'});
 page.on('pageerror',e=>result.errors.push(String(e)));
 await page.addInitScript(()=>{window.__simLocal=true;localStorage.setItem('chuck-norris-settings-v2',JSON.stringify({quality:'battery',autoSpin:false,pitMode:0}));});
 await page.goto(base);
 await page.waitForFunction(()=>window.__viewer?.state.ready,null,{timeout:180000});
 await page.evaluate(()=>window.__viewer.api.selectSubsystem('intake'));
 result.transparency=await page.evaluate(()=>{
  const v=window.__viewer.viewer;
  return {focused:v.focused,parts:v.focusPids.length,ghosts:v.ghosts.filter(g=>g.visible&&g.material.transparent).length};
 });
 assert.ok(result.transparency.focused&&result.transparency.parts>0&&result.transparency.ghosts>0,'Subsystem focus activates transparent ghost geometry for surrounding parts');
 await page.evaluate(()=>window.__viewer.api.enterSim('free'));
 await page.waitForFunction(()=>window.__viewer.state.sim?.active&&window.__viewer.state.sim.world,null,{timeout:180000});
 await page.evaluate(()=>{const s=window.__viewer.state.sim;s.paused=true;for(let i=0;i<s.world.fuel.n;i++)s.world.fuel.park(i,[20,0,i*.01]);});
 for(const key of ['w','s','a','d','q','e']){
  const before=await page.evaluate(()=>{
   const s=window.__viewer.state.sim,w=s.world;w.takeOver();w.robot.place(-6.1,-1.5,-Math.PI/2);
   s.paused=false;for(let i=0;i<30;i++)s.frame(1/60);s.paused=true;
   return {x:w.robot.x,z:w.robot.z,th:w.robot.th};
  });
  await page.keyboard.down(key);
  const after=await page.evaluate(()=>{
   const s=window.__viewer.state.sim;s.paused=false;for(let i=0;i<60;i++)s.frame(1/60);s.paused=true;
   const r=s.world.robot,v=window.__viewer.viewer;v.root.updateMatrixWorld(true);
   return {x:r.x,z:r.z,th:r.th,front:new window.__viewer.THREE.Vector3(0,0,1).transformDirection(v.root.matrixWorld).toArray()};
  });
  await page.keyboard.up(key);
  result.directions[key]={dx:after.x-before.x,dz:after.z-before.z,turn:Math.atan2(Math.sin(after.th-before.th),Math.cos(after.th-before.th)),front:after.front};
 }
 const d=result.directions;
 assert.ok(d.w.dx>.5&&d.s.dx<-.5&&d.a.dz<-.5&&d.d.dz>.5,'WASD move in all four intended field directions');
 assert.ok(Math.abs(d.q.turn)>.25&&Math.abs(d.e.turn)>.25&&d.q.turn*d.e.turn<0,'Q/E rotate the swerve robot in opposite directions');
 assert.ok(Math.hypot(...d.q.front.map((v,i)=>v-d.e.front[i]))>.4,'Actual CAD rotates with the physics body');
 assert.deepEqual(result.errors,[]);
 result.passed=true;console.log('PASS',JSON.stringify(result));
}finally{fs.writeFileSync('test-results/cybercats/direction-results.json',JSON.stringify(result,null,2));await browser.close();await close();}
