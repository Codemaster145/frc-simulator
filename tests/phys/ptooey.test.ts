import {test,expect} from 'vitest';
import {driverWorld,input,run} from './helpers';
import {ptooeyPose,MAIN_RADIUS,UPPER_RADIUS} from '../../src/ptooey-geometry';
import {cadPointToBody} from '../../src/sim/robot-frame';
import {AimTable} from '../../src/sim/phys/aim';
import hood from '../../src/hood-calibration.json';
test('one Ptooey outlet follows the measured turret and hood transforms and clears both wheels',async()=>{
 const w=await driverWorld(-6,-1.5,0,{clearFuel:true});try{
  expect(w.robot.turrets).toHaveLength(1);const t=w.robot.turrets[0];
  for(const yaw of [-1,0,1.4])for(const pitch of [45,60,72]){
   t.a=yaw;t.hood=pitch*Math.PI/180;const p=ptooeyPose(yaw,t.hood);
   const expected=w.robot.toWorld(...cadPointToBody(p.origin));
   expect(w.robot.exitWorld(t)).toEqual(expected);
   expect(Math.hypot(...p.origin.map((x,i)=>x-p.main[i]))).toBeGreaterThan(MAIN_RADIUS+.075);
   expect(Math.hypot(...p.origin.map((x,i)=>x-p.upper[i]))).toBeGreaterThan(UPPER_RADIUS+.075);
   const ray=w.robot.shotRay(t),d=w.robot.velToWorld(...cadPointToBody(p.direction));
   d.forEach((x,i)=>expect(ray.direction[i]).toBeCloseTo(x,8));
  }
 }finally{w.dispose();}
});
test('mechanism phases advance with physical flywheel speed and indexer feeding, then indexer stops',async()=>{
 const w=await driverWorld(-6.1,-1.5,Math.PI/2);try{
  const r=w.robot;run(w,1,input({shoot:true}));
  expect(r.indexerPhase).toBeGreaterThan(0);expect(r.turrets[0].flyPhase).toBeGreaterThan(0);
  const wheelPhase=r.turrets[0].flyPhase;run(w,.1,input({shoot:true}));
  expect(r.turrets[0].flyPhase-wheelPhase).toBeGreaterThan(2*Math.PI);
  const phase=r.indexerPhase;run(w,.5,input({}));expect(r.indexerPhase).toBe(phase);
 }finally{w.dispose();}
});

test('manual hood uses the same servo and ballistic solver, clamps demo bounds, and returns to automatic aiming',async()=>{
 const w=await driverWorld(-6.1,-1.5,Math.PI/2);try{
  const r=w.robot,t=r.turrets[0];r.setHoodOverride(50);const before=t.hood;
  run(w,1/120,input({shoot:true}));expect(Math.abs(t.hood-before)).toBeLessThanOrEqual(hood.degreesPerSecond*Math.PI/180/120+1e-8);
  run(w,.5,input({shoot:true}));expect(t.hood).toBeCloseTo(50*Math.PI/180,6);
  expect(w.status().shooter?.manual).toBe(true);expect(w.status().shooter?.targetDegrees).toBeCloseTo(50,5);
  r.setHoodOverride(999);run(w,.3,input({}));expect(t.hoodGoal).toBeCloseTo(hood.maxDegrees*Math.PI/180,6);
  r.setHoodOverride(null);run(w,.5,input({}));expect(w.status().shooter?.manual).toBe(false);
  expect(t.hoodGoal).toBeCloseTo(AimTable.shared().hoodAt(t.distance)*Math.PI/180,3);
 }finally{w.dispose();}
});
