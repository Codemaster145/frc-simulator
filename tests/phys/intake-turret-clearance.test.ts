import {test,expect} from 'vitest';
import fs from 'node:fs';
import * as T from 'three';
import {MeshBVH} from 'three-mesh-bvh';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {CAD_MOTIONS} from '../../src/cad-motions';
import {intakePose} from '../../src/intake-linkage';
import {REST_PITCH} from '../../src/ptooey-geometry';
import groups from '../../src/intake-groups.json';
import hood from '../../src/hood-calibration.json';

test('intake travel clears the turret at sampled yaw and hood settings',async()=>{
 const metadata=JSON.parse(fs.readFileSync('public/models/cybercats.parts.json','utf8'));
 const turret=CAD_MOTIONS.find(m=>m.id==='ptooey-turret')!,elevation=CAD_MOTIONS.find(m=>m.id==='ptooey-hood')!;
 const turretIds=new Set(turret.parts),hoodIds=new Set(elevation.parts);
 for(let pid=1;pid<metadata.partNode.length;pid++)for(let n=metadata.partNode[pid];n>=0;n=metadata.tree[n][1])if(turret.nodes?.includes(n)){turretIds.add(pid);break;}
 const membership=new Map<number,string>();for(const k of ['upper','lower','coupler','pin'] as const)for(const id of groups[k])membership.set(id,k);
 for(const id of turretIds)membership.set(id,hoodIds.has(id)?'hood':'turret');
 const buf=fs.readFileSync('public/models/cybercats.glb'),root=(await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'')).scene;root.updateMatrixWorld(true);
 const buckets=new Map<string,{vertices:number[];pids:number[]}>();
 root.traverse(o=>{if(!(o instanceof T.Mesh))return;const g=o.geometry,p=g.attributes.position,ids=g.attributes._partid,idx=g.index;for(let i=0;i<(idx?.count??p.count);i+=3){const ix=[0,1,2].map(k=>idx?idx.getX(i+k):i+k),id=ids.getX(ix[0]),key=membership.get(id);if(!key)continue;if(!buckets.has(key))buckets.set(key,{vertices:[],pids:[]});const b=buckets.get(key)!;for(const j of ix)b.vertices.push(...new T.Vector3().fromBufferAttribute(p,j).applyMatrix4(o.matrixWorld).toArray());b.pids.push(id);}});
 const bodies=new Map([...buckets].map(([key,b])=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.vertices,3));return [key,{bvh:new MeshBVH(g,{indirect:true}),pids:b.pids}] as const;}));
 const rotation=(pivot:number[],axis:number[],angle:number)=>new T.Matrix4().makeTranslation(...pivot as [number,number,number]).multiply(new T.Matrix4().makeRotationAxis(new T.Vector3(...axis).normalize(),angle)).multiply(new T.Matrix4().makeTranslation(...pivot.map(x=>-x) as [number,number,number]));
 const interference:{intake:number;yaw:number;hood:number;pairs:string[]}[]=[];let samples=0;
 for(let degrees=0;degrees<=74;degrees+=2){const pose=intakePose(degrees);
  const transforms=new Map((['upper','lower','coupler','pin'] as const).map(k=>{const p=pose[k];return [k,new T.Matrix4().makeTranslation(...p.position).multiply(new T.Matrix4().makeRotationX(p.angle)).multiply(new T.Matrix4().makeTranslation(...p.pivot.map(x=>-x) as [number,number,number])).invert()];}));
  for(let yaw=0;yaw<360;yaw+=15)for(const pitch of [hood.minDegrees,REST_PITCH*180/Math.PI,hood.maxDegrees]){samples++;const t=rotation(turret.pivot,turret.axis,yaw*Math.PI/180),h=t.clone().multiply(rotation(elevation.pivot,elevation.axis,pitch*Math.PI/180-REST_PITCH)),pairs=new Set<string>();
   for(const [key,inverse]of transforms)for(const [other,transform]of [['turret',t],['hood',h]] as const){const a=bodies.get(key)!,b=bodies.get(other)!;a.bvh.bvhcast(b.bvh,inverse.clone().multiply(transform),{intersectsTriangles:(ta,tb,ia,ib)=>{if(ta.intersectsTriangle(tb)){pairs.add(`${a.pids[a.bvh.resolveTriangleIndex(ia)]}/${b.pids[b.bvh.resolveTriangleIndex(ib)]}`);return true;}return false;}});}
   if(pairs.size)interference.push({intake:degrees,yaw,hood:pitch,pairs:[...pairs]});
  }
 }
 fs.mkdirSync('test-results/cybercats',{recursive:true});fs.writeFileSync('test-results/cybercats/intake-turret-clearance.json',JSON.stringify({note:'Discrete original-CAD surface audit: intake every 2°, turret every 15°, hood minimum/export/maximum. Does not certify continuous or real hardware clearance.',samples,interference},null,2));
 expect(interference).toEqual([]);
},120000);
