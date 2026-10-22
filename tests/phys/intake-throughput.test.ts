import {expect,test} from 'vitest';
import {makeWorld,input,run} from './helpers';

test('three simultaneous roller contacts are accepted in the same physics step',async()=>{
 const w=await makeWorld();try{
  w.takeOver();
  for(let i=0;i<w.fuel.n;i++)w.fuel.park(i,[20,0,i*.01]);
  const r=w.robot;r.place(-6,-1.5,0);r.setIntakeNow(true);r.rollers='in';
  for(let i=0;i<3;i++)w.fuel.place(i,r.toWorld((i-1)*.18,.075,.65));
  w.fuel.syncAll();
  let accepted=0;r.onIntake=()=>accepted++;
  w.step(input({}));
  expect(accepted).toBe(3);
  expect(r.load).toBe(3);
  expect(r.captured).toHaveLength(3);
 }finally{w.dispose();}
});

test('a dense pile passes more than four FUEL through the original fast intake',async()=>{
 const w=await makeWorld();try{
  w.takeOver();
  for(let i=0;i<w.fuel.n;i++)w.fuel.park(i,[20,0,i*.01]);
  const r=w.robot;r.place(-6,-1.5,0);r.setIntakeNow(true);r.rollers='in';
  for(let i=0;i<24;i++)w.fuel.place(i,r.toWorld((i%6-2.5)*.15,.077,.82+Math.floor(i/6)*.15));
  w.fuel.syncAll();
  let accepted=0;r.onIntake=()=>accepted++;
  run(w,3,input({mz:1}));
  expect(accepted).toBeGreaterThan(12);
  expect(r.captured).toHaveLength(0);
 }finally{w.dispose();}
});
