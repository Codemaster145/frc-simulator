import {expect,test} from 'vitest';
import {makeWorld,input,run} from './helpers';
import {CAPACITY_DOWN,CAPACITY_UP} from '../../src/sim/phys/robot';

test('restores the original uncalibrated hopper capacities, separate from intake transit',async()=>{
 const w=await makeWorld();try{
  expect([CAPACITY_DOWN,CAPACITY_UP]).toEqual([48,32]);
  expect(w.robot.load).toBe(8);
  expect(w.robot.stored).toBe(8);
  expect(w.status().intakeFlow?.waiting).toBe(0);
  expect(w.status().intakeFlow?.full).toBe(false);
 }finally{w.dispose();}
});

test('intake delivers multiple FUEL to the hopper and the unchanged indexer launches them',async()=>{
 const w=await makeWorld();try{
  w.takeOver();for(let i=0;i<w.fuel.n;i++)w.fuel.park(i,[20,0,i*.01]);
  const r=w.robot;r.place(-6,-1.5,0);r.setIntakeNow(true);r.rollers='in';
  for(let i=0;i<8;i++)w.fuel.place(i,r.toWorld((i%4-1.5)*.15,.077,.67+Math.floor(i/4)*.15));
  w.fuel.syncAll();let accepted=0,shots=0;const prior=r.onShot;
  r.onIntake=()=>accepted++;r.onShot=(i,side)=>{prior?.(i,side);shots++;};
  run(w,2);expect(accepted).toBeGreaterThanOrEqual(4);expect(r.captured).toHaveLength(0);
  expect(r.stored).toBeGreaterThan(0);
  run(w,10,input({shoot:true}));expect(shots).toBeGreaterThan(0);
 }finally{w.dispose();}
},120000);
