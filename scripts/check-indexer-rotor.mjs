import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const result={checks:[],errors:[]};
try{
 const page=await browser.newPage({viewport:{width:1200,height:850},serviceWorkers:'block'});
 page.on('pageerror',e=>result.errors.push(String(e)));
 await page.addInitScript(()=>{window.__simLocal=true;localStorage.setItem('chuck-norris-settings-v2',JSON.stringify({quality:'battery',autoSpin:false,pitMode:0,simView:'follow'}));});
 await page.goto('http://127.0.0.1:5187/');await page.waitForFunction(()=>window.__viewer?.state.ready,null,{timeout:180000});
 result.viewer=await page.evaluate(async()=>{
  const {viewer:v,state:s,api,THREE:T}=window.__viewer;
  s.autoSpin=false;s.idleReset=false;api.overview();v.spinning=false;v.showAll();v.setFocus(null);
  const rotor=(await import('/src/indexer-rotor.json')).default;
  const {CAD_MOTIONS}=await import('/src/cad-motions.ts');const motion=CAD_MOTIONS.find(m=>m.id==='dye-driven');
  const {chainPose,CHAIN_TRAVEL_PER_RADIAN}=await import('/src/cad-chain-motion.ts');
  const chain=(await import('/src/cad-chain.json')).default;const link=chain.links.findIndex(l=>l.pid===1363);
  const c=id=>v.boxOfParts([id],false).getCenter(new T.Vector3());
  const moving=[1225,1230,1320,1325,1327,1328,1352,1264,1292,1359,1243,1481],fixed=[1476,1480,1307,1246,1258,1269,1302,1330,1492,1493,1496,1497,1570,2117,1019];
  v.setMechanismNow('dye-drive',0);v.syncPose();const rest=Object.fromEntries([...moving,...fixed].map(id=>[id,c(id).toArray()]));
  const samples=[];for(const degrees of [315,630,945,1260]){
   v.setMechanismNow('dye-drive',degrees);v.syncPose();const radians=-degrees*Math.PI/180;
   const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),radians*motion.drive.ratio),p=new T.Vector3(...motion.pivot);
   const motorQ=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),radians);
   const linkNode=v.mechanisms.get('dye-link-1363').nodes[0].node;
   const linkExpected=chainPose(link,radians*CHAIN_TRAVEL_PER_RADIAN);
   const sprocketError=Math.max(...['dye-driven','dye-idler1','dye-idler2'].flatMap(id=>{
    const m=CAD_MOTIONS.find(def=>def.id===id),want=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),radians*m.drive.ratio);
    return v.mechanisms.get(id).nodes.map(n=>n.node.quaternion.angleTo(want));
   }));
   samples.push({degrees,movingError:Math.max(...moving.map(id=>c(id).distanceTo(new T.Vector3(...rest[id]).sub(p).applyQuaternion(q).add(p)))),fixedError:Math.max(...fixed.map(id=>c(id).distanceTo(new T.Vector3(...rest[id])))),motorError:Math.max(...v.mechanisms.get('dye-drive').nodes.map(n=>n.node.quaternion.angleTo(motorQ))),sprocketError,chainError:linkNode.position.distanceTo(new T.Vector3(...linkExpected.position))});
  }
  v.setMechanismNow('dye-drive',0);v.syncPose();
  const wanted=new Set(v.parts.partsUnder[1433]);v.setHidden(Array.from({length:v.parts.count},(_,i)=>i+1).filter(i=>!wanted.has(i)),true);
  v.controls.setLookAt(.65,.65,.8,0,.16,-.04,false);v.settle();v.dirty=true;
  const label=document.createElement('div');label.id='indexer-caption';label.style.cssText='position:fixed;bottom:12px;left:15px;right:15px;background:#142236ef;padding:15px;color:white;font:17px system-ui;z-index:999;';label.textContent='V2 Dye Rotor — original CAD at 0°. Cylindrical guide and bolted carrier follow the 42T hub; external motor and mounts stay fixed.';document.body.append(label);
  return {samples,carrierParts:rotor.carrier.length,ratio:motion.drive.ratio};
 });
 for(const s of result.viewer.samples){assert.ok(s.movingError<1e-6,JSON.stringify(s));assert.ok(s.fixedError<1e-6,JSON.stringify(s));assert.ok(s.motorError<1e-6&&s.sprocketError<1e-6&&s.chainError<1e-6,JSON.stringify(s));}
 result.checks.push('Viewer: manual steps rotate guide and 12T/42T transmission in the reversed direction at 12:42; chain links follow; external supports stay fixed');
 await page.addStyleTag({content:'.dock,.chips,.panel,.pin,.status,.title,.hint{visibility:hidden!important}'});
 await page.screenshot({path:'docs/mechanism-review/v2-rotor-rest.png',timeout:180000});
 await page.evaluate(()=>{const v=window.__viewer.viewer;v.setMechanismNow('dye-drive',315);v.syncPose();v.dirty=true;document.getElementById('indexer-caption').textContent='V2 Dye Rotor — reversed 90° carrier rotation from 315° of the 12T drive. Chain and sprockets follow; external motor housing remains fixed.';});
 await page.screenshot({path:'docs/mechanism-review/v2-rotor-quarter-turn.png',timeout:180000});
 // Return the viewer to its complete assembled pose before the actual gameplay check.
 await page.evaluate(()=>{const {viewer:v,state:s}=window.__viewer;document.getElementById('indexer-caption').remove();document.querySelectorAll('style').forEach(e=>{if(e.textContent.includes('visibility:hidden!important'))e.remove();});v.showAll();v.setMechanismNow('dye-drive',0);v.syncPose();s.autoSpin=false;});
 await page.locator('.dock .tool').filter({hasText:'Simulate'}).click();await page.waitForFunction(()=>window.__viewer.state.sim?.backend?.frame,null,{timeout:180000});
 await page.evaluate(()=>{
  const s=window.__viewer.state.sim,w=s.world,r=w.robot;w.takeOver();r.place(-6,-1.5,0);r.setIntakeNow(true);r.rollers='in';
  for(let i=0;i<w.fuel.n;i++)w.fuel.park(i,[20,0,i*.01]);
  for(let i=0;i<30;i++)s.frame(1/60);
  window.__rotorCaught=0;r.onIntake=()=>window.__rotorCaught++;
  w.fuel.place(0,r.toWorld(0,.075,.65));w.fuel.syncAll();
 });
 await page.keyboard.down('Space');
 result.gameplay=await page.evaluate(async()=>{
  const {viewer:v,state:s,THREE:T}=window.__viewer,sim=s.sim,w=sim.world,r=w.robot;
  const start={shots:r.shotsFired,score:w.scored,phase:r.indexerPhase};let laneSeen=false,maxPoseError=0;
  const {CAD_MOTIONS}=await import('/src/cad-motions.ts');const ratio=CAD_MOTIONS.find(m=>m.id==='dye-driven').drive.ratio;
  for(let i=0;i<480;i++){
   sim.frame(1/60);laneSeen||=r.turrets.some(t=>t.lane.length>0);
   if(i%15===0){sim.present(1);const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),-sim.f.robot.indexerPhase*ratio);maxPoseError=Math.max(maxPoseError,...v.mechanisms.get('dye-driven').nodes.map(n=>n.node.quaternion.angleTo(q)));}
  }
  sim.present(1);return {caught:window.__rotorCaught,laneSeen,shots:r.shotsFired-start.shots,score:w.scored-start.score,indexerDelta:r.indexerPhase-start.phase,maxPoseError};
 });
 await page.keyboard.up('Space');
 assert.ok(result.gameplay.caught>0&&result.gameplay.laneSeen);assert.equal(result.gameplay.shots,1);assert.equal(result.gameplay.score,1);assert.ok(result.gameplay.indexerDelta>0&&result.gameplay.maxPoseError<1e-6);
 result.checks.push('Browser: ground FUEL collected, enters indexer lane, launches through Ptooey and scores in HUB; rotor follows reversed visual phase during continuous feeding');
 await page.screenshot({path:'docs/mechanism-review/v2-rotor-simulation.png',timeout:180000});
 await page.close();assert.deepEqual(result.errors,[]);console.log('PASS',JSON.stringify(result));
}finally{fs.writeFileSync('test-results/cybercats/indexer-rotor-browser.json',JSON.stringify(result,null,2));await browser.close();}
