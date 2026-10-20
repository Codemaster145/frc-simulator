import {expect,test} from 'vitest';
import {makeWorld,input,run} from './helpers';

test('each simulation start eases from the estimated stowed pose to deployed in exactly half a second',async()=>{
 const w=await makeWorld();try{
  for(const mode of ['free','highscore','free'] as const){
   w.setMode(mode);
   expect(w.robot.intakeAngle).toBe(74);
   expect(w.robot.intakeDown).toBe(false);
   w.step(input({}));
   expect(w.robot.intakeAngle).toBeLessThan(74);
   expect(w.robot.intakeAngle).toBeGreaterThan(0);
   expect(w.robot.intakeDown).toBe(true);
   run(w,.25-1/120);
   expect(w.robot.intakeAngle).toBeCloseTo(37,6);
   run(w,.25);
   expect(w.robot.intakeAngle).toBe(0);
   run(w,.25);
   expect(w.robot.intakeAngle).toBe(0);
  }
  w.setIntakeMaximum(60);
  w.setMode('free');
  expect(w.robot.intakeAngle).toBe(74); // startup reference, independent of later manual limit
  run(w,.5);expect(w.robot.intakeAngle).toBe(0);
  w.setIntakeCommand('retract');run(w,2);expect(w.robot.intakeAngle).toBe(60);
 }finally{w.dispose();}
});

test('startup easing preserves later smooth manual Retract, Deploy and Toggle',async()=>{
 const w=await makeWorld();try{
  run(w,.5);
  w.setIntakeCommand('retract');run(w,2);expect(w.robot.intakeAngle).toBe(74);
  w.setIntakeCommand('deploy');run(w,2);expect(w.robot.intakeAngle).toBe(0);
  w.setIntakeCommand('toggle');run(w,2);expect(w.robot.intakeAngle).toBe(74);
 }finally{w.dispose();}
});

test('autonomous free drive keeps the startup intake deployed until a manual retract command',async()=>{
 const w=await makeWorld();try{
  run(w,.5);
  let retractedAt:number|null=null;
  for(let i=0;i<60*120;i++){
   w.step(input({}));
   if(!w.robot.intakeDown){retractedAt=i/120;break;}
  }
  expect(retractedAt).toBeNull();
  w.setIntakeCommand('retract');run(w,2);expect(w.robot.intakeAngle).toBe(74);
 }finally{w.dispose();}
},120000);

test('AI recovery does not retract the deployed startup intake on its own',async()=>{
 const w=await makeWorld();try{
  run(w,.5);
  const brain=w.brain as unknown as {progress:{strikes:number;t:number};forced:boolean;checkStuck:(dt:number)=>void};
  brain.progress.strikes=1;brain.progress.t=1.2;brain.forced=true;
  brain.checkStuck(0);
  expect(w.robot.intakeDown).toBe(true);
 }finally{w.dispose();}
});

test('first driving handoff collects the starting FUEL pile after automatic deployment',async()=>{
 const w=await makeWorld();try{
  // Driving alone must not turn off the rollers that automatic deployment enabled.
  run(w,.5);
  const r=w.robot;let caught=0;r.onIntake=()=>caught++;
  for(let i=0;i<12;i++){
   w.fuel.place(i,r.toWorld((i%4-1.5)*.16,.075,.85+Math.floor(i/4)*.16));
  }
  w.fuel.syncAll();
  const startX=r.x;
  run(w,1.5,input({mx:1}));
  expect(w.control).toBe('driver');
  expect(r.x).toBeGreaterThan(startX+.1);
  expect(r.rollers).toBe('in');
  expect(caught).toBeGreaterThan(0);
 }finally{w.dispose();}
});

test('FUEL already touching the collection region is captured on the first active deployment',async()=>{
 const w=await makeWorld();try{
  // Take control while the intake is still lowering, then overlap the roller just
  // before the deployed pose. Collection checks positions each step, not only entry events.
  w.step(input({mx:1}));
  run(w,.5-2/120);
  const r=w.robot;let caught=0;r.onIntake=()=>caught++;
  w.fuel.place(0,r.toWorld(0,.075,.65));w.fuel.syncAll();
  run(w,3/120);
  expect(r.intakeAngle).toBe(0);
  expect(caught).toBe(1);
  expect(r.captured.filter(c=>c.i===0)).toHaveLength(1);
  run(w,.1);
  expect(caught).toBe(1);
 }finally{w.dispose();}
});

test('every new Free Drive and High Score match starts with a collecting intake',async()=>{
 const w=await makeWorld();try{
  for(const mode of ['free','highscore','free'] as const){
   w.setMode(mode);
   expect(w.robot.intakeAngle).toBe(74);
   run(w,mode==='highscore'?3.1:.5);
   expect(w.robot.intakeAngle).toBe(0);
   expect(w.robot.disabled).toBe(false);
   expect(w.robot.rollers).toBe('in');
   w.takeOver();
   expect(w.robot.rollers).toBe('in');
  }
 }finally{w.dispose();}
});

test('manual roller toggle and arm commands still stop, stow, redeploy, and collect',async()=>{
 const w=await makeWorld();try{
  run(w,.5);
  w.step(input({toggleIntake:true}));
  expect(w.robot.rollers).toBe('off');
  run(w,2);
  expect(w.robot.intakeAngle).toBe(74);
  w.step(input({toggleIntake:true}));
  run(w,2);
  expect(w.robot.intakeAngle).toBe(0);
  expect(w.robot.rollers).toBe('in');
  w.setIntakeCommand('retract');run(w,2);expect(w.robot.intakeAngle).toBe(74);
  w.setIntakeCommand('deploy');run(w,2);expect(w.robot.intakeAngle).toBe(0);
  let caught=0;w.robot.onIntake=()=>caught++;
  w.fuel.place(0,w.robot.toWorld(0,.075,.65));w.fuel.syncAll();
  run(w,.25);
  expect(caught).toBe(1);
 }finally{w.dispose();}
});
