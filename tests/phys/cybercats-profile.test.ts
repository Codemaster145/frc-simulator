import { expect, test } from 'vitest';
import { ROBOT } from '../../src/sim/phys/config';
import profile from '../../src/robot-profile.json';
import { driverWorld } from './helpers';

test('CyberCats CAD mass and transformed COM reach the physics body configuration', () => {
  expect(ROBOT.mass).toBeCloseTo(124.3 * 0.45359237, 8);
  const a = profile.cad.yawDegrees * Math.PI / 180;
  const [x, y, z] = [-1.593, -3.223, 7.012].map(v => v * 0.0254);
  // The inherited demo body uses intake-facing +Z. Canonical CAD +Z is the confirmed front.
  expect(profile.physics.modelYawDegrees).toBe(180);
  expect(profile.physics.centerOfMassMeters[0]).toBeCloseTo(Math.cos(a) * x + Math.sin(a) * y, 8);
  expect(ROBOT.com[0]).toBeCloseTo(-profile.physics.centerOfMassMeters[0], 8);
  expect(ROBOT.com[1]).toBeCloseTo(z - profile.cad.groundZ, 8);
  expect(profile.physics.centerOfMassMeters[2]).toBeCloseTo(Math.sin(a) * x - Math.cos(a) * y, 8);
  expect(ROBOT.com[2]).toBeCloseTo(-profile.physics.centerOfMassMeters[2], 8);
});

test('point velocities use the off-center CAD COM rather than the CAD origin', async () => {
  const w = await driverWorld(-6, 0, 0, { clearFuel: true });
  const r = w.robot;
  r.body.setLinvel({x:1,y:2,z:3},true);
  r.body.setAngvel({x:2,y:3,z:4},true);
  const center = r.body.worldCom();
  const local = r.toLocal(center.x,center.y,center.z);
  const expected = r.body.linvel();
  const actual = r.pointVel(local[0],local[1],local[2]);
  expect(actual[0]).toBeCloseTo(expected.x, 5);
  expect(actual[1]).toBeCloseTo(expected.y, 5);
  expect(actual[2]).toBeCloseTo(expected.z, 5);
  w.engine.world.free();
});

test('confirmed chassis dimensions stay separate from unconfirmed demo bumpers', () => {
  expect(ROBOT.chassis).toEqual({ width: 0.6985, length: 0.6985 });
  expect(profile.physics.bumperDimensionsMeters).toBeNull();
  expect(ROBOT.bumper.hx).toBe(0.441);
  expect(ROBOT.bumper.hz).toBe(0.429);
  expect(profile.physics.demoApproved).toBe(true);
  expect(profile.physics.notice).toContain('Uncalibrated demo physics');
});
