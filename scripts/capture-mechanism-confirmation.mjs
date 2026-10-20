import {chromium} from 'playwright';
import fs from 'node:fs';
fs.mkdirSync('docs/mechanism-review',{recursive:true});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1200,height:850},serviceWorkers:'block'});
 await page.addInitScript(()=>localStorage.setItem('chuck-norris-settings-v2',JSON.stringify({quality:'battery',autoSpin:false,pitMode:0})));
 await page.goto('http://127.0.0.1:5187/');await page.waitForFunction(()=>window.__viewer?.state.ready,null,{timeout:180000});
 await page.addStyleTag({content:'.dock,.chips,.panel,.pin,.status,.title,.hint{visibility:hidden!important}'});
 const views=[
  ...[50,70].map(hood=>({id:`hood-${hood}`,node:2195,pos:[.95,.55,.015],target:[.006,.50,.005],hood,hide:[2021,2023,2001,2144,2101],labels:[],caption:`Ptooey hood at ${hood} degrees launch pitch · Measured M-shaft pivot. Interior plates and upper/lower roller banks move together. Green: sole M–U release; amber: hood pivot. Calibration is temporary.`})),
  {id:'shooter-gap-review',node:2195,pos:[.9,.57,.02],target:[.006,.49,0],only:[2026,2117,2157,2082,2090,2145,1978,2002,2003,2012,2120,2147,2006,2036,2058,2081,2046],labels:[['M: 4-inch wheel bank',[.02,.435,-.15]],['U: upper 2-inch rollers',[.02,.574,.072]],['L: lower 2-inch rollers',[.02,.49,.12]],['Proposed single release',[.006,.57,-.045]]],ray:{p:[.006,.535,-.02],d:[0,.855,-.519]},caption:'Ptooey cutaway · Proposed upward path between M and U (green). Plates hidden for inspection. Confirm the two contacting banks and exit direction before activation.'},
  {id:'indexer-chain-review',node:1433,pos:[.15,-.9,-.4],target:[.06,.06,-.1],labels:[['M: motor output / 12T',[.191,.06,-.274]],['I1: 12T sprocket',[.177,.06,-.102]],['I2: 12T sprocket',[.109,.06,-.088]],['S: 42T sprocket + SplineXL',[.00635,.06,0]]],ray:{p:[.00635,.03,0],d:[0,1,0]},caption:'Dye Rotor underside · The chain connects M, I1, I2 and S. Green: proposed vertical driven axis. Motor housing and support plates remain fixed. Rotor body above S is not identified.'},
  {id:'indexer-motor-review',node:1433,pos:[.75,.65,-.75],target:[.08,.14,-.12],hide:[1225,1230,1320,1325,1328,1352,1327],labels:[['Motor housing stays fixed',[.191,.215,-.274]],['Driven SplineXL shaft',[.00635,.14,0]]],ray:{p:[.00635,.03,0],d:[0,1,0]},caption:'Dye Rotor cutaway · Fixed walls/plates hidden to expose the motor-to-chain-to-hub connection. Shaft axis and actual rotor membership still need confirmation.'},
  {id:'turret-confirmed',node:1882,pos:[.7,.9,-.9],target:[.006,.4,0],angle:60,labels:[['Camera rotates with upper shooter',[.006,.46,-.2]],['Wide plate / external motor stay fixed',[-.26,.38,.07]]],ray:{p:[.00635,.3393,0],d:[0,1,0]},caption:'Confirmed turret group at +60 degrees · Upper shooter + camera + 200T gear rotate. Support ring and gear-mounted bearing stacks rotate too. Wide plate and external motor/gearbox stay fixed.'},
  {id:'indexer-rotor-membership',node:1433,pos:[.5,.65,.6],target:[0,.13,0],hide:[1225,1230,1320,1325,1328,1352],focus:[1327,1336,1337,1340,1342,1344],labels:[['Gray disc: Dye Lower Pinion Support Plate',[.08,.126,.07]],['Confirmed hub / shaft',[.00635,.139,0]]],ray:{p:[.00635,.03,0],d:[0,1,0]},caption:'Actual indexer cutaway · 42T sprocket, SplineXL shaft and hub are driven. The broad circular part is named Dye Lower Pinion Support Plate; it also carries offset gearing. No separate paddle/impeller above the hub was identified. Support plates are kept fixed.'},
 ];
 // Retain earlier question images as historical evidence; create updated hood, turret and rotor views.
 const currentViews=views.filter(v=>v.hood||['turret-confirmed','indexer-rotor-membership'].includes(v.id));
 for(const item of currentViews){
  await page.evaluate(async item=>{
   const {viewer:v,state:s,api,THREE:T}=window.__viewer;s.autoSpin=false;s.idleReset=false;api.overview();v.spinning=false;v.showAll();v.setFocus(null);
   for(const m of v.mechanisms.values())v.setMechanismNow(m.id,0);if(item.angle)v.setMechanismNow('ptooey-turret',item.angle);v.syncPose();
   if(item.hood){const {REST_PITCH,ptooeyPose,MAIN_CENTER}=await import('/src/ptooey-geometry.ts');v.setMechanismNow('ptooey-hood',item.hood-REST_PITCH*180/Math.PI);v.syncPose();const p=ptooeyPose(0,item.hood*Math.PI/180);item.ray={p:p.origin,d:p.direction};item.labels=[['M / actual hood pivot',MAIN_CENTER],['U / hood-mounted bank',p.upper],['One release point',p.origin]];}
   if(window.__marks)v.scene.remove(window.__marks);const marks=new T.Group();window.__marks=marks;v.scene.add(marks);
   const wanted=new Set(item.only??v.parts.partsUnder[item.node]);v.setHidden(Array.from({length:v.parts.count},(_,i)=>i+1).filter(i=>!wanted.has(i)),true);if(item.hide)v.setHidden(item.hide,true);
   if(item.focus)v.setFocus(item.focus);
   if(item.hood){const {MAIN_CENTER,SHOOTER_AXIS}=await import('/src/ptooey-geometry.ts');const a=new T.ArrowHelper(new T.Vector3(...SHOOTER_AXIS),new T.Vector3(...MAIN_CENTER),.2,0xffb938,.02,.01);marks.add(a);}
   if(item.ray){const a=new T.ArrowHelper(new T.Vector3(...item.ray.d).normalize(),new T.Vector3(...item.ray.p),.16,0x44ff88,.025,.018);a.traverse(o=>{if(o.material)o.material.depthTest=false;o.renderOrder=999;});marks.add(a);}
   v.controls.setLookAt(...item.pos,...item.target,false);v.settle();v.dirty=true;v.camera.updateMatrixWorld();
   document.querySelectorAll('.review-label').forEach(e=>e.remove());
   for(const [text,pt] of item.labels){const p=new T.Vector3(...pt).project(v.camera),e=document.createElement('div');e.className='review-label';e.textContent=text;e.style.cssText=`position:fixed;left:${(p.x+1)*innerWidth/2}px;top:${(1-p.y)*innerHeight/2}px;transform:translate(-50%,-100%);color:white;background:#0a1728e8;border:1px solid #85a8cc;padding:6px;font:15px system-ui;pointer-events:none;`;document.body.append(e);}
   const e=document.createElement('div');e.className='review-label';e.textContent=item.caption;e.style.cssText='position:fixed;bottom:12px;left:20px;right:20px;color:white;background:#15202fef;padding:16px;font:17px system-ui;border:1px solid #ffb938';document.body.append(e);
  },item);
  await page.screenshot({path:`docs/mechanism-review/${item.id}.png`,timeout:180000});console.log('Captured',item.id);
 }
}finally{await browser.close();}
