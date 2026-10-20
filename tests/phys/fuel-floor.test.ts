import {expect,test} from 'vitest';
import {driverWorld} from './helpers';
import {FUEL} from '../../src/sim/phys/config';

test('a severe active-contact floor penetration recovers even during a strong impact',async()=>{
 const w=await driverWorld(-6,0,0,{clearFuel:true});
 const f=w.fuel;
 // Reproduce the soak's floor penetration while the ball is still moving vertically.
 f.place(0,[-6.42,.04,-2.56],[0,-1,0]);
 f.vel[1]=1;
 const lost:number[]=[];
 f.postStep(i=>lost.push(i));
 expect(f.pos[1]).toBeGreaterThanOrEqual(FUEL.radius-.001);
 expect(f.bodies[0].linvel().y).toBeGreaterThanOrEqual(0);
 expect(lost).toEqual([]);
 w.engine.world.free();
});
