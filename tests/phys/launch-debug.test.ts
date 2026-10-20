import {expect,test} from 'vitest';
import {driverWorld} from './helpers';
import {frameOf} from '../../src/sim/local';

test('debug rays expose the actual launch origin and follow each turret angle',async()=>{
 const w=await driverWorld(-6,-1.5,0,{clearFuel:true}),r=w.robot,t=r.turrets[0];
 try{
  t.a=0;t.hood=Math.PI/3;
  const a=frameOf(w,0,0,0,[],false,false,false).robot.turrets[0] as unknown as {origin:number[];direction:number[]};
  expect(a.origin).toEqual(r.exitWorld(t));expect(a.direction).toBeDefined();
  t.a=Math.PI/2;
  const b=frameOf(w,0,0,0,[],false,false,false).robot.turrets[0] as unknown as {origin:number[];direction:number[]};
  expect(b.origin).toEqual(r.exitWorld(t));
  // Chassis pitch/roll also tilt the CAD: compare the quarter-turn in the body frame.
  const da=r.velToLocal(...a.direction as [number,number,number]),db=r.velToLocal(...b.direction as [number,number,number]);
  expect(da[0]*db[0]+da[2]*db[2]).toBeCloseTo(0,6);
  expect(da[1]).toBeCloseTo(db[1],6);
  t.fly=400;
  (r as unknown as {launch(t:unknown,i:number):void}).launch(t,0);
  expect(Array.from(w.fuel.pos.slice(0,3)).every((x,i)=>Math.abs(x-b.origin[i])<1e-5)).toBe(true);
 }finally{w.dispose();}
});
