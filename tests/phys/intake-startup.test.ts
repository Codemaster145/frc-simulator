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
