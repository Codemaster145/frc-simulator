import {chromium} from 'playwright';
import fs from 'node:fs';
fs.mkdirSync('docs/mechanism-review',{recursive:true});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:820},serviceWorkers:'block'});
 await page.addInitScript(()=>localStorage.setItem('chuck-norris-settings-v2',JSON.stringify({quality:'battery',autoSpin:false,pitMode:0})));
 await page.goto('http://127.0.0.1:5187/');
 await page.waitForFunction(()=>window.__viewer?.state.ready,null,{timeout:180000});
 await page.addStyleTag({content:'.dock,.chips,.panel,.pin,.status,.title,.hint{visibility:hidden!important}'});
 const views=[
  {id:'shooter-side',node:1884,pos:[1.1,.53,0],target:[.006,.46,0],label:'PTOOEY — SIDE VIEW: +Z is left. A (green): upper opening; B (pink): flywheel side. Which is the exit?',arrows:true},
  {id:'shooter-top',node:1884,pos:[.006,1.7,.001],target:[.006,.36,0],label:'PTOOEY — TOP VIEW: one centered turret ring; two brass wheels share one shaft.'},
  {id:'rotor',node:1433,pos:[.6,.65,.8],target:[0,.13,0],label:'DYE ROTOR — inspect rotating hub and fixed plates; axis/membership under review.'},
  {id:'rotor-bottom',node:1433,pos:[.5,-.55,.6],target:[0,.13,0],label:'DYE ROTOR — UNDERSIDE: chain/sprocket/hub. No inferred animation enabled yet.'},
  {id:'rotor-cutaway',node:1433,pos:[.5,.75,.6],target:[0,.13,0],hide:[1225,1230,1320,1325,1328,1352],label:'DYE ROTOR — plates, walls and ramp hidden to expose internals. Amber axis passes through SplineXL hub.',rotor:true}
 ];
 for(const item of views){
  await page.evaluate(item=>{
   const {viewer:v,state:s,api,THREE:T}=window.__viewer;s.autoSpin=false;s.idleReset=false;api.overview();v.spinning=false;v.showAll();v.setFocus(null);
   if(window.__auditMarks)v.scene.remove(window.__auditMarks);const marks=new T.Group();window.__auditMarks=marks;v.scene.add(marks);
   const wanted=new Set(v.parts.partsUnder[item.node]);
   v.setHidden(Array.from({length:v.parts.count},(_,i)=>i+1).filter(i=>!wanted.has(i)),true);
   if(item.hide)v.setHidden(item.hide,true);
   function arrow(origin,dir,color){const a=new T.ArrowHelper(new T.Vector3(...dir).normalize(),new T.Vector3(...origin),.18,color,.035,.025);a.traverse(o=>{if(o.material)o.material.depthTest=false;o.renderOrder=999;});marks.add(a);}
   if(item.arrows){arrow([.006,.58,.07],[0,.65,.75],0x44ff88);arrow([.006,.5,-.17],[0,.65,-.75],0xff5599);arrow([.00633,.3393,0],[0,1,0],0xffb938);}
   if(item.rotor)arrow([.00633,.08,0],[0,1,0],0xffb938);
   v.controls.setLookAt(...item.pos,...item.target,false);v.settle();v.dirty=true;
   let label=document.getElementById('review-label');if(!label){label=document.createElement('div');label.id='review-label';label.style.cssText='position:fixed;bottom:12px;left:20px;right:20px;color:white;background:#15202fef;padding:18px;font:17px system-ui;border:1px solid #ffb938';document.body.append(label);}label.textContent=item.label;
  },item);
  await page.screenshot({path:`docs/mechanism-review/${item.id}.png`,timeout:180000});console.log('Captured',item.id);
 }
}finally{await browser.close();}
