import { test } from 'vitest';
import { ROBOT } from '../../src/sim/phys/config';
import { driverWorld, run, input } from '../phys/helpers';
test('isolate bump behavior changes', async () => {
  const original = {mass: ROBOT.mass, com: [...ROBOT.com], chassis: {...ROBOT.chassis}};
  for (const variant of ['new', 'old-mass', 'old-com', 'old-chassis', 'baseline']) {
    ROBOT.mass = variant === 'old-mass' || variant === 'baseline' ? 61 : original.mass;
    ROBOT.com = (variant === 'old-com' || variant === 'baseline' ? [0,.17,-.03] : original.com) as [number,number,number];
    ROBOT.chassis = variant === 'old-chassis' || variant === 'baseline' ? {width:.712,length:.686} : original.chassis;
    const w = await driverWorld(-6,1.5,Math.PI/2,{clearFuel:true}); let pitch=0,roll=0;
    run(w,3,input({mx:1}),()=>{pitch=Math.max(pitch,Math.abs(w.robot.pitch));roll=Math.max(roll,Math.abs(w.robot.roll));});
    console.log(variant, {x:w.robot.x,z:w.robot.z,th:w.robot.th,pitch:pitch*57.3,roll:roll*57.3});
    w.engine.world.free();
  }
  Object.assign(ROBOT,original);
});
