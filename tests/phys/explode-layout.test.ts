import {expect,test} from 'vitest';
import * as T from 'three';
import {planExplodedLayout} from '../../src/explode-layout';

test('exploded CAD layout keeps chassis and swerve central and separates complete assembly bounds',()=>{
 const box=(cx:number,cy:number,cz:number,w:number,h:number,d:number)=>new T.Box3().setFromCenterAndSize(new T.Vector3(cx,cy,cz),new T.Vector3(w,h,d));
 const assembled=new Map([
  ['swerve',box(0,.107,0,.857,.213,.857)],
  ['frame',box(0,.251,.012,.698,.417,.407)],
  ['intake',box(0,.290,-.316,.850,.510,.667)],
  ['turrets',box(0,.329,-.014,.704,.520,.441)],
  ['indexer',box(0,.173,0,.633,.301,.699)],
  ['electrical',box(0,.259,-.007,.639,.455,.633)],
 ]);
 const offsets=planExplodedLayout(assembled);
 const moved=new Map([...assembled].map(([id,b])=>[id,b.clone().translate(offsets.get(id)!)]));
 expect(offsets.get('swerve')!.length()).toBe(0);
 expect(moved.get('frame')!.min.y-moved.get('swerve')!.max.y).toBeGreaterThan(.04);
 const core=moved.get('frame')!.clone().union(moved.get('swerve')!);
 expect(core.min.x-moved.get('intake')!.max.x).toBeGreaterThan(.08);
 expect(moved.get('turrets')!.min.x-core.max.x).toBeGreaterThan(.08);
 for(const [id,b] of moved)for(const [other,c] of moved){
  if(id>=other||(id==='frame'&&other==='swerve'))continue;
  const gap=Math.max(c.min.x-b.max.x,b.min.x-c.max.x,c.min.y-b.max.y,b.min.y-c.max.y,c.min.z-b.max.z,b.min.z-c.max.z);
  expect(gap,`${id} and ${other} overlap`).toBeGreaterThan(.04);
 }
});
