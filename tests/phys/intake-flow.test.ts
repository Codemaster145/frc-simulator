import {expect,test} from 'vitest';
import {makeWorld,input,run} from './helpers';
import {BS} from '../../src/sim/phys/fuel';

test('dense starting pile respects four-FUEL capacity and keeps overflow outside the intake',async()=>{
 const w=await makeWorld();try{
  w.takeOver();
  for(let i=0;i<w.fuel.n;i++)w.fuel.park(i,[20,0,i*.01]);
  const r=w.robot;
  r.place(-6,-1.5,0);r.setIntakeNow(true);r.rollers='in';
  for(let i=0;i<24;i++)w.fuel.place(i,r.toWorld((i%6-2.5)*.15,.077,.82+Math.floor(i/6)*.15));
  w.fuel.syncAll();
  let accepted=0;r.onIntake=()=>accepted++;
  run(w,2,input({mz:1}));
  expect(r.capacity).toBe(4);
  expect(r.load).toBe(4);
  expect(accepted).toBe(4);
  for(let i=0;i<24;i++)if(w.fuel.st[i]===BS.FREE&&!r.onboard.includes(i)&&!r.captured.some(c=>c.i===i)){
   const o=i*3,p=r.toLocal(w.fuel.pos[o],w.fuel.pos[o+1],w.fuel.pos[o+2]);
   if(Math.abs(p[0])<.3&&p[1]<.28&&p[2]>.25)expect(p[2],`overflow FUEL ${i} entered the throat`).toBeGreaterThan(.53);
  }
 }finally{w.dispose();}
},120000);

test('a new match never starts above four-FUEL capacity',async()=>{
 const w=await makeWorld();try{
  for(const mode of ['free','highscore','free'] as const){
   w.setMode(mode);
   expect(w.robot.capacity).toBeLessThanOrEqual(4);
   expect(w.robot.load).toBe(0);
  }
 }finally{w.dispose();}
});

test('four accepted balls feed the shooter and free space for another four without cycling the intake',async()=>{
 const w=await makeWorld();try{
  w.takeOver();
  for(let i=0;i<w.fuel.n;i++)w.fuel.park(i,[20,0,i*.01]);
  const r=w.robot;r.place(-6,-1.5,0);r.setIntakeNow(true);r.rollers='in';
  let accepted=0,shots=0;const oldShot=r.onShot;
  r.onIntake=()=>accepted++;
  r.onShot=(i,side)=>{oldShot?.(i,side);shots++;};
  for(let batch=0;batch<3;batch++){
   for(let k=0;k<8;k++)w.fuel.place(batch*8+k,r.toWorld((k%4-1.5)*.15,.077,.67+Math.floor(k/4)*.15));
   w.fuel.syncAll();
   let peak=0;run(w,1,input({}),()=>{peak=Math.max(peak,r.load);});
   expect(peak).toBeLessThanOrEqual(4);
   expect(accepted).toBeGreaterThanOrEqual((batch+1)*4);
   run(w,8,input({shoot:true}),()=>{peak=Math.max(peak,r.load);});
   expect(peak).toBeLessThanOrEqual(4);
   expect(shots).toBeGreaterThanOrEqual((batch+1)*4);
  }
 }finally{w.dispose();}
},120000);

test('only roller-accepted FUEL counts as stored or enters the indexer',async()=>{
 const w=await makeWorld();try{
  w.takeOver();for(let i=0;i<w.fuel.n;i++)w.fuel.park(i,[20,0,i*.01]);
  const r=w.robot;r.place(-6,-1.5,0);r.setIntakeNow(true);r.rollers='off';
  w.fuel.place(0,r.toWorld(0,.3,.2));w.fuel.syncAll();
  run(w,.2,input({shoot:true}));
  expect(r.load).toBe(0);
  expect(r.onboard).not.toContain(0);
  expect(r.turrets[0].lane).toHaveLength(0);
 }finally{w.dispose();}
});

test('a lost accepted ball releases its storage slot so a later ball can enter',async()=>{
 const w=await makeWorld();try{
  w.takeOver();for(let i=0;i<w.fuel.n;i++)w.fuel.park(i,[20,0,i*.01]);
  const r=w.robot;r.place(-6,-1.5,0);r.setIntakeNow(true);r.rollers='in';
  w.fuel.place(0,r.toWorld(0,.077,.67));w.fuel.syncAll();
  run(w,.5);expect(r.load).toBe(1);
  w.fuel.park(0,[20,0,0]);run(w,1/120);
  expect(r.load).toBe(0);
  w.fuel.place(1,r.toWorld(0,.077,.67));w.fuel.syncAll();run(w,.5);
  expect(r.load).toBe(1);
 }finally{w.dispose();}
});

test('optional physics diagnostics identify intake capacity and waiting transfer state',async()=>{
 const w=await makeWorld();try{
  expect(w.status().intakeFlow).toEqual({stored:0,available:4,waiting:0,indexerBlocked:false,full:false,jamRecovery:false});
  w.takeOver();for(let i=0;i<w.fuel.n;i++)w.fuel.park(i,[20,0,i*.01]);
  const r=w.robot;r.place(-6,-1.5,0);r.setIntakeNow(true);r.rollers='in';
  for(let i=0;i<4;i++)w.fuel.place(i,r.toWorld((i-1.5)*.15,.077,.67));w.fuel.syncAll();
  run(w,.5);
  expect(w.status().intakeFlow?.stored).toBe(4);
  expect(w.status().intakeFlow?.available).toBe(0);
  expect(w.status().intakeFlow?.full).toBe(true);
 }finally{w.dispose();}
});
