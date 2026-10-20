import {expect,test} from 'vitest';
import {intakePose,moveIntakePoint,A,B,C,D,E,F} from '../../src/intake-linkage';
import {driverWorld,input,run} from './helpers';
import {CAD_MOTIONS} from '../../src/cad-motions';
const distance=(a:number[],b:number[])=>Math.hypot(...a.map((x,i)=>x-b[i]));
test('deployed four-bar matches CAD and retains link lengths without branch flips',()=>{
 const zero=intakePose(0);expect(distance(zero.C,C)).toBeLessThan(1e-9);expect(distance(zero.D,D)).toBeLessThan(1e-9);
 for(let angle=0;angle<=74;angle+=.5){const p=intakePose(angle);
  expect(distance(p.C,A)).toBeCloseTo(distance(C,A),8);expect(distance(p.D,B)).toBeCloseTo(distance(D,B),8);
  expect(distance(p.C,p.D)).toBeCloseTo(distance(C,D),8);
  expect(distance(moveIntakePoint(D,p.coupler),p.D)).toBeLessThan(1e-8);
  expect(distance(moveIntakePoint(F,p.pin),p.F)).toBeLessThan(1e-8);
  expect(p.C[1]).toBeGreaterThanOrEqual(C[1]);
 }
});
test('all four actual linkage bodies and cycloidal outputs are bound to the deploy control',()=>{
 for(const body of ['upper','lower','coupler','pin'])expect(CAD_MOTIONS.some(m=>m.intakeBody===body)).toBe(true);
 expect(CAD_MOTIONS.find(m=>m.id==='intake')?.parts).toEqual(expect.arrayContaining([1019,1131,1199,1211]));
});
test('deployment commands smoothly raise to the configurable estimate, lower, toggle, and honor match disable',async()=>{
 const w=await driverWorld(-6,-1.5,0,{clearFuel:true});try{
  const r=w.robot;w.setIntakeCommand('retract');let last=0;
  run(w,2,input({}),()=>{expect(r.intakeAngle).toBeGreaterThanOrEqual(last-1e-8);expect(r.intakeAngle-last).toBeLessThanOrEqual(70/120+1e-7);last=r.intakeAngle;});
  expect(r.intakeAngle).toBe(74);w.setIntakeMaximum(60);expect(r.intakeAngle).toBe(74);
  run(w,1);expect(r.intakeAngle).toBe(60);w.setIntakeCommand('deploy');run(w,2);expect(r.intakeAngle).toBe(0);
  w.setIntakeCommand('toggle');run(w,2);expect(r.intakeAngle).toBe(60);
  r.disabled=true;w.setIntakeCommand('deploy');expect(r.intakeDown).toBe(false);
 }finally{w.dispose();}
});
test('ground FUEL is collected only with the real intake down and running',async()=>{
 for(const down of [true,false]){
  const w=await driverWorld(-6,-1.5,0,{clearFuel:true,intakeDown:down});try{
   const r=w.robot;r.rollers='in';let caught=0;r.onIntake=()=>caught++;
   w.fuel.place(0,r.toWorld(0,.075,.65));w.fuel.syncAll();
   run(w,1);expect(caught>0).toBe(down);expect(r.intakeRollerPhase).toBeGreaterThan(0);
  }finally{w.dispose();}
 }
});
test('a ground FUEL ball travels through intake and indexer to the single shooter and HUB',async()=>{
 const w=await driverWorld(-6,-1.5,0,{clearFuel:true});try{
  const r=w.robot;r.rollers='in';let caught=0;r.onIntake=()=>caught++;
  w.fuel.place(0,r.toWorld(0,.075,.65));w.fuel.syncAll();
  run(w,8,input({shoot:true}));
  expect(caught).toBeGreaterThan(0);expect(r.indexerPhase).toBeGreaterThan(0);
  expect(r.shotsFired).toBe(1);expect(w.scored).toBe(1);
 }finally{w.dispose();}
});
