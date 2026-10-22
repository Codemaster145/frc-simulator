import {expect,test} from 'vitest';
import {makeWorld,input,run} from './helpers';

test('several roller-gripped balls complete the internal intake passage without stalling',async()=>{
 const w=await makeWorld();try{
  w.takeOver();for(let i=0;i<w.fuel.n;i++)w.fuel.park(i,[20,0,i*.01]);
  const r=w.robot;r.place(-6,-1.5,0);r.setIntakeNow(true);r.rollers='in';
  const ids=[0,1,2,3,4,5];
  for(let k=0;k<ids.length;k++)w.fuel.place(ids[k],r.toWorld((k%3-1)*.18,.075,.66+Math.floor(k/3)*.16));
  w.fuel.syncAll();
  const accepted=new Set<number>();r.onIntake=i=>accepted.add(i);
  run(w,2,input({mz:.5}));
  expect(accepted.size).toBeGreaterThan(4);
  expect(r.captured.length).toBe(0);
  expect(r.onboard.length).toBeGreaterThan(0);
 }finally{w.dispose();}
},120000);

test('a ball displaced inside the throat remains driven instead of being abandoned among internal colliders',async()=>{
 const w=await makeWorld();try{
  w.takeOver();for(let i=0;i<w.fuel.n;i++)w.fuel.park(i,[20,0,i*.01]);
  const r=w.robot;r.place(-6,-1.5,0);r.setIntakeNow(true);r.rollers='in';
  w.fuel.place(0,r.toWorld(0,.075,.66));w.fuel.syncAll();
  run(w,1/120);expect(r.captured.some(c=>c.i===0)).toBe(true);
  const diagnostic=r.intakeDiagnostics().find(b=>b.id===0);
  expect(diagnostic).toMatchObject({stage:'transport',driven:true,reachedExit:false,indexerBlocked:false});
  expect(diagnostic?.position).toHaveLength(3);
  expect(diagnostic?.velocity).toHaveLength(3);
  expect(diagnostic?.contacts).toBeInstanceOf(Array);
  w.fuel.bodies[0].setTranslation({x:r.toWorld(0,.41,.53)[0],y:r.toWorld(0,.41,.53)[1],z:r.toWorld(0,.41,.53)[2]},true);
  w.fuel.syncAll();run(w,1/120);
  expect(r.captured.some(c=>c.i===0)).toBe(true);
  run(w,2);expect(r.captured.some(c=>c.i===0)).toBe(false);
  expect(r.onboard).toContain(0);
 }finally{w.dispose();}
},120000);

test('optional diagnostics identify a physical front-roller contact without claiming roller drive',async()=>{
 const w=await makeWorld();try{
  w.takeOver();for(let i=0;i<w.fuel.n;i++)w.fuel.park(i,[20,0,i*.01]);
  const r=w.robot;r.place(-6,-1.5,0);r.setIntakeNow(true);r.rollers='off';
  w.fuel.place(0,r.toWorld(0,.08,.624));w.fuel.syncAll();run(w,1/120);
  const b=r.intakeDiagnostics().find(v=>v.id===0);
  expect(b?.driven).toBe(false);
  expect(b?.contacts).toContain('front roller');
 }finally{w.dispose();}
},120000);

test('dense pile clears the internal passage without leaving unaccepted FUEL pinned behind the roller',async()=>{
 const w=await makeWorld();try{
  w.takeOver();for(let i=0;i<w.fuel.n;i++)w.fuel.park(i,[20,0,i*.01]);
  const r=w.robot;r.place(-6,-1.5,0);r.setIntakeNow(true);r.rollers='in';
  for(let i=0;i<24;i++)w.fuel.place(i,r.toWorld((i%6-2.5)*.15,.077,.82+Math.floor(i/6)*.15));
  w.fuel.syncAll();const accepted=new Set<number>();r.onIntake=i=>accepted.add(i);
  run(w,3,input({mz:1}));
  expect(accepted.size).toBeGreaterThan(12);
  expect(r.captured).toHaveLength(0);
  for(let i=0;i<24;i++){const o=i*3,p=r.toLocal(w.fuel.pos[o],w.fuel.pos[o+1],w.fuel.pos[o+2]);
   if(Math.abs(p[0])<.33&&p[2]>.25&&p[2]<.5&&p[1]>.1)expect(r.onboard,`FUEL ${i} remained inside without reaching the hopper`).toContain(i);
  }
 }finally{w.dispose();}
},120000);
