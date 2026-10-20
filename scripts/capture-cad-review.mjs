// Captures real rendered CAD with temporary review annotations; does not alter the asset.
import { chromium } from 'playwright';
import fs from 'node:fs';
const out='docs/cad-review'; fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
  const page=await browser.newPage({viewport:{width:1100,height:820},deviceScaleFactor:1});
  await page.addInitScript(()=>localStorage.setItem('chuck-norris-settings-v2',JSON.stringify({quality:'battery',autoSpin:false,idleReset:false})));
  await page.goto('http://127.0.0.1:5187/');
  await page.waitForFunction(()=>window.__viewer?.state.ready,null,{timeout:180000});
  await page.addStyleTag({content:'.dock,.chips,.panel,.pin,.status,.title,.hint,.loading{visibility:hidden!important}'});
  const views=[
    {file:'01-forward',title:'CONFIRMED FORWARD — OPPOSITE INTAKE',note:'Amber arrow points away from Arthritis (Intake), as confirmed by the team. Runtime +Z forward; +Y up. Chassis: 27.5 × 27.5 in. The extended intake is not the bumper envelope.',patterns:[],arrow:true},
    {file:'02-intake',title:'ARTHRITIS — INTAKE: CANDIDATE MOVING GROUP',note:'Highlighted: CAD group “Pivot” and its descendants. Roller shafts appear to run across the chassis. Which children pivot, which stay fixed, and what are the stowed/deployed limits? No motion is assigned.',patterns:['Pivot'],axis:[1,0,0]},
    {file:'03-indexer',title:'A THUNK A THUNK — DYE ROTOR / INDEXER',note:'Highlighted: V2 Dye Rotor and Flopper assemblies. CAD contains no joint definitions. Please identify the rotating shafts, moving parts and any flopper limits. No axis or travel is asserted.',patterns:['V2 Dye Rotor','Flopper Assemb']},
    {file:'04-shooter',title:'PTOOEY — SHOOTER: CANDIDATE AXES',note:'Highlighted: 200T turntable gear and two brass flywheels. Amber vertical arrow marks the candidate turntable axis. Gear center is inferred from geometry; moving group, limits and launch direction need confirmation.',patterns:['am-5038 200T','Brass Flywheel'],turret:true},
    {file:'05-swerve',title:'SWERVE — CAD COMPONENT IDENTIFICATION',note:'Highlighted: MK3 Center Columns and 4-in tread names within four SDS MK4n assemblies. Steering axes appear vertical. Names and geometry do not confirm installed motors, gearing, tire diameter or wheelbase.',patterns:['MK3 Center Column','Tread, Black Nitrile']}
  ];
  for(const item of views.filter(v=>!process.argv[2]||v.file.startsWith(process.argv[2]))){
    await page.evaluate(item=>{
      const {viewer:v,state:s,THREE:T,api}=window.__viewer;
      s.autoSpin=false;s.idleReset=false;v.spinning=false;api.overview();
      if(window.__reviewArrow){v.scene.remove(window.__reviewArrow);window.__reviewArrow=null;}
      const pids=item.patterns.length?v.parts.partsMatching(item.patterns):null;
      v.setFocus(pids);v.setGhostStrength(.22);
      v.controls.setLookAt(item.arrow?1.8:1.2,item.arrow?2:1.35,item.arrow?2.5:1.65,0,.25,.1,false);
      if(item.arrow||item.turret){
        const arrow=new T.ArrowHelper(new T.Vector3(0,item.turret?1:0,item.arrow?1:0),new T.Vector3(item.turret?.00633:.48,item.turret?.3393:.48,item.turret?0:.05),item.turret?.42:.7,0xffb938,.12,.07);
        arrow.line.material.depthTest=false;arrow.cone.material.depthTest=false;arrow.renderOrder=999;arrow.line.renderOrder=999;arrow.cone.renderOrder=999;
        v.scene.add(arrow);window.__reviewArrow=arrow;
      }
      let panel=document.getElementById('cad-review-label');
      if(!panel){panel=document.createElement('div');panel.id='cad-review-label';panel.style.cssText='position:fixed;left:24px;right:24px;bottom:24px;padding:18px 22px;background:#101521f2;border:2px solid #ffb938;border-radius:12px;color:#fff;font:17px/1.45 system-ui;z-index:99999';document.body.append(panel);}
      panel.replaceChildren();const title=document.createElement('strong');title.textContent=item.title;title.style.cssText='display:block;color:#ffcf73;font-size:20px;margin-bottom:7px';panel.append(title,document.createTextNode(item.note));
      v.settle();v.dirty=true;
      return pids?.length;
    },item);
    await page.waitForTimeout(800);
    await page.screenshot({path:`${out}/${item.file}.png`,timeout:180000});
    console.log('Captured',item.file);
  }
  fs.writeFileSync(`${out}/index.html`,'<!doctype html><meta charset="utf-8"><title>CyberCats CAD confirmation</title><style>body{font:18px/1.5 system-ui;background:#101114;color:#eee;max-width:1100px;margin:30px auto}img{width:100%}section{margin-bottom:50px}a{color:#ffcf73}</style><h1>CyberCats CAD: confirmation needed</h1><p>These are annotated renders of your actual CAD. Forward is team-confirmed. Amber mechanism axes indicate hypotheses, not confirmed joints. No uncertain mechanism animation has been enabled.</p>'+views.map(v=>`<section><h2>${v.title}</h2><img src="${v.file}.png"><p>${v.note}</p></section>`).join(''));
} finally {await browser.close();}
