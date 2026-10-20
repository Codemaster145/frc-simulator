import {expect,test} from 'vitest';
import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {rigCadModel,correctCadClassification,type CadMotion} from '../../src/cad-rig';
import type {PartsFile} from '../../src/parts';
import {CAD_MOTIONS} from '../../src/cad-motions';

function metadata():PartsFile{return JSON.parse(fs.readFileSync('public/models/cybercats.parts.json','utf8'));}
function stats(model:T.Object3D){
 model.updateMatrixWorld(true);let tris=0;const boxes=new Map<number,T.Box3>();const v=new T.Vector3();
 model.traverse(o=>{if(!(o instanceof T.Mesh))return;const g=o.geometry,pos=g.getAttribute('position'),ids=g.getAttribute('_partid');tris+=(g.index?.count??pos.count)/3;
  for(let i=0;i<pos.count;i++){const id=ids.getX(i);if(!boxes.has(id))boxes.set(id,new T.Box3());v.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);boxes.get(id)!.expandByPoint(v);}
 });return {tris,boxes};
}
test('swerve turret assemblies are drivetrain; named electronics retain their category',()=>{
 const p=metadata();correctCadClassification(p);
 for(const n of [139,146,234,246,699,703,811,817])expect(p.subsystems[p.tree[n][3]]).toBe('swerve');
 for(const n of [3,4,5,9,11,12,72,195,687,765,2394])expect(p.subsystems[p.tree[n][3]]).toBe('electrical');
 expect(p.subsystems[p.tree[1887][3]]).toBe('turrets'); // Support remains inspectable with its turret; it is not a moving selection.
});

test('V2 cylindrical guide follows the 42T shaft without moving external supports or other mechanisms',async()=>{
 const b=fs.readFileSync('public/models/cybercats.glb');
 const model=(await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene;
 const p=metadata(),rig=rigCadModel(model,p,CAD_MOTIONS),rest=stats(rig);
 const motion=CAD_MOTIONS.find(m=>m.id==='dye-driven')!;
 expect(Math.abs(motion.drive!.ratio)).toBeCloseTo(12/42,12);
 const guide=[1225,1230,1268,1320,1325,1327,1328,1352,1264,1292,1359,1243,1291,1329,1348,1353,1502,1252,1481];
 for(const id of guide)expect(p.mechanisms[p.tree[p.partNode[id]][4]],`part ${id}`).toBe('dye-driven');
 const fixed=[1476,1480,1307,1246,1258,1269,1302,1330,1492,1493,1496,1497,1570,1668,2117,1019];
 const center=(s:ReturnType<typeof stats>,id:number)=>s.boxes.get(id)!.getCenter(new T.Vector3());
 const pivot=new T.Vector3(...motion.pivot),axis=new T.Vector3(0,1,0);
 // 3.5 input revolutions = one output revolution. Quarter turns exercise asymmetric guides.
 for(const inputTurns of [.875,1.75,2.625,3.5]){
  const angle=inputTurns*2*Math.PI*motion.drive!.ratio;
  rig.traverse(o=>{if(o.userData.mechanism==='dye-driven')o.quaternion.setFromAxisAngle(axis,angle);});
  const moved=stats(rig);expect(moved.tris).toBe(rest.tris);expect(moved.boxes.size).toBe(2269);
  for(const id of guide){const expected=center(rest,id).sub(pivot).applyAxisAngle(axis,angle).add(pivot);expect(center(moved,id).distanceTo(expected),`part ${id}`).toBeLessThan(1e-6);}
  for(const id of fixed)expect(moved.boxes.get(id)!.equals(rest.boxes.get(id)!),`fixed part ${id}`).toBe(true);
 }
});
test('part-ID partition preserves the full real CAD and moves only specified nested groups',async()=>{
 const b=fs.readFileSync('public/models/cybercats.glb');
 const model=(await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene;
 const before=stats(model),p=metadata();
 const motions:CadMotion[]=CAD_MOTIONS;
 const rig=rigCadModel(model,p,motions),rest=stats(rig);
 expect(rest.tris).toBe(before.tris);expect(rest.boxes.size).toBe(2269);
 for(const [id,a] of before.boxes){const b=rest.boxes.get(id)!;expect(a.min.distanceTo(b.min)+a.max.distanceTo(b.max)).toBeLessThan(1e-6);}
 rig.traverse(o=>{if(o.userData.mechanism==='ptooey-turret')o.quaternion.setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2);});
 const moved=stats(rig);
 expect(moved.boxes.get(2117)!.getCenter(new T.Vector3()).distanceTo(rest.boxes.get(2117)!.getCenter(new T.Vector3()))).toBeGreaterThan(.08);
 for(const id of [1668,1696,1476,1225,1327,1328,1352])expect(moved.boxes.get(id)!.equals(rest.boxes.get(id)!)).toBe(true); // stationary mount/supports/motors/indexer
 expect(moved.boxes.get(1748)!.getCenter(new T.Vector3()).distanceTo(rest.boxes.get(1748)!.getCenter(new T.Vector3()))).toBeGreaterThan(.1); // bearing stack orbits with gear
 const cameraPid=p.partNode.findIndex(n=>n===2394);
 expect(moved.boxes.get(cameraPid)!.getCenter(new T.Vector3()).distanceTo(rest.boxes.get(cameraPid)!.getCenter(new T.Vector3()))).toBeGreaterThan(.05);
 expect(p.subsystems[p.tree[2394][3]]).toBe('electrical');
 let nested=false;rig.traverse(o=>{if(o.userData.mechanism==='ptooey-flywheel'){let a=o.parent;while(a){if(a.userData.mechanism==='ptooey-turret')nested=true;a=a.parent;}}});expect(nested).toBe(true);
});
