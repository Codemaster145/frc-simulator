import {expect,test} from 'vitest';
import {makeWorld,input,run} from './helpers';
import {BS} from '../../src/sim/phys/fuel';

test('every match restores the original eight physical hopper preloads and intake startup state',async()=>{
 const w=await makeWorld();try{
  expect(w.preloadIdx).toHaveLength(8);
  for(const mode of ['free','highscore','free'] as const){
   w.setMode(mode);
   const r=w.robot;
   expect(r.load).toBe(8);
   expect(r.capacity).toBeGreaterThan(8);
   expect(w.status().stored).toBe(8);
   expect(r.intakeAngle).toBe(74);
   expect(r.rollers).toBe('in');
   for(const i of w.preloadIdx){
    expect(w.fuel.st[i]).toBe(BS.FREE);
    const p=r.toLocal(...Array.from(w.fuel.pos.slice(i*3,i*3+3)));
    expect(Math.abs(p[0])).toBeLessThan(.35);
    expect(p[1]).toBeGreaterThan(.1);
    expect(p[2]).toBeGreaterThan(-.04);
    expect(p[2]).toBeLessThan(.67);
   }
  }
 }finally{w.dispose();}
});

test('eight startup preloads are shootable and intake continues after they leave',async()=>{
 const w=await makeWorld();try{
  w.takeOver();
  for(let i=0;i<w.fuel.n;i++)if(!w.preloadIdx.includes(i))w.fuel.park(i,[20,0,i*.01]);
  let shots=0;const prior=w.robot.onShot;w.robot.onShot=(i,side)=>{prior?.(i,side);shots++;};
  run(w,15,input({shoot:true}));
  expect(shots).toBe(8);
  expect(w.robot.load).toBe(0);
  const r=w.robot;
  w.fuel.place(0,r.toWorld(0,.075,.65));w.fuel.syncAll();
  run(w,.5);
  expect(r.load).toBe(1);
 }finally{w.dispose();}
},120000);
