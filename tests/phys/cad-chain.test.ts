import {expect,test} from 'vitest';
import data from '../../src/cad-chain.json';
import {chainPose,CHAIN_LENGTH} from '../../src/cad-chain-motion';
test('all original chain links retain their centers at rest and close around the measured path',()=>{
 expect(new Set(data.links.map(l=>l.sourceNode)).size).toBe(107);
 for(let i=0;i<data.links.length;i++){
  const p=chainPose(i,0),q=chainPose(i,CHAIN_LENGTH);
  for(let k=0;k<3;k++){expect(p.position[k]).toBeCloseTo(data.links[i].center[k],9);expect(q.position[k]).toBeCloseTo(p.position[k],9);}
  expect(Math.sin(p.angle)).toBeCloseTo(0,9);expect(Math.sin(q.angle)).toBeCloseTo(0,9);
  const moved=chainPose(i,.003);expect(Math.hypot(...moved.position.map((x,k)=>x-p.position[k]))).toBeCloseTo(.003,4);
 }
});
