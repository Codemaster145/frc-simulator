import {chromium} from 'playwright';
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1200,height:850},serviceWorkers:'block'});
 await page.addInitScript(()=>localStorage.setItem('chuck-norris-settings-v2',JSON.stringify({quality:'battery',autoSpin:false,pitMode:0})));
 await page.goto('http://127.0.0.1:5187/');await page.waitForFunction(()=>window.__viewer?.state.ready,null,{timeout:180000});
 await page.addStyleTag({content:'.dock,.chips,.panel,.pin,.status,.title,.hint{visibility:hidden!important}'});
 const views=[
  {id:'intake-linkage-review',pos:[-1.5,.38,-.40],target:[0,.25,-.40],cutaway:true,labels:[['A · Cycloidal output / upper Driver arm',[-.34,.2345,-.2175]],['B · Lower shaft / Part 8 link',[-.33,.1708,-.3235]],['Coupler · moving roller support',[-.31,.19,-.60]]]},
  {id:'intake-cycloidal-side',pos:[-1.5,.33,-.40],target:[0,.25,-.40],labels:[['A: cycloidal output axis',[-.34,.2345,-.2175]],['B: lower cross-shaft',[-.33,.1708,-.3235]],['Collection roller bank',[-.30,.155,-.624]]]},
  {id:'intake-cycloidal-oblique',pos:[-1.15,1.05,-1.25],target:[0,.2,-.39],labels:[['23:1 cycloidal housing',[-.345,.235,-.2175]],['Motor / 22T–30T gears',[-.085,.14,-.312]],['Lower cross-shaft',[.15,.171,-.324]]]},
 ];
 for(const item of views){
  await page.evaluate(item=>{
   const {viewer:v,state:s,api,THREE:T}=window.__viewer;s.autoSpin=false;s.idleReset=false;api.overview();v.spinning=false;v.showAll();v.setFocus(null);
   const wanted=new Set(v.parts.partsOf(828));v.setHidden(Array.from({length:v.parts.count},(_,i)=>i+1).filter(i=>!wanted.has(i)),true);
   if(item.cutaway){v.setHidden([824,829],true);v.setFocus([677,686,682,706,667,749,1199,1211,1019,1131]);}
   if(window.__marks)v.scene.remove(window.__marks);const marks=new T.Group();window.__marks=marks;v.scene.add(marks);
   for(const [p,color] of [[[0,.2345,-.2175],0x44ff88],[[0,.1708,-.3235],0xffb938]]){
    const a=new T.ArrowHelper(new T.Vector3(-1,0,0),new T.Vector3(...p),.42,color,.04,.02);a.traverse(o=>{if(o.material)o.material.depthTest=false;o.renderOrder=999;});marks.add(a);
   }
   v.controls.setLookAt(...item.pos,...item.target,false);v.settle();v.dirty=true;v.camera.updateMatrixWorld();
   document.querySelectorAll('.review-label').forEach(e=>e.remove());
   for(const [text,pt] of item.labels){const p=new T.Vector3(...pt).project(v.camera),e=document.createElement('div');e.className='review-label';e.textContent=text;e.style.cssText=`position:fixed;left:${(p.x+1)*innerWidth/2}px;top:${(1-p.y)*innerHeight/2}px;transform:translate(-50%,-100%);color:white;background:#0a1728e8;border:1px solid #85a8cc;padding:6px;font:15px system-ui;pointer-events:none;`;document.body.append(e);}
   const e=document.createElement('div');e.className='review-label';e.textContent='Actual Arthritis CAD · Green A: cycloidal output centerline. Amber B: lower cross-shaft. Output-to-arm connection, fixed/moving membership and stowed limits require confirmation.';e.style.cssText='position:fixed;bottom:12px;left:20px;right:20px;color:white;background:#15202fef;padding:16px;font:17px system-ui;border:1px solid #ffb938';document.body.append(e);
  },item);
  await page.screenshot({path:`docs/mechanism-review/${item.id}.png`,timeout:180000});console.log('Captured',item.id);
 }
}finally{await browser.close();}
