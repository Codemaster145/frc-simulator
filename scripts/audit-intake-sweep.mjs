import fs from 'node:fs';
import * as T from 'three';
import {MeshBVH} from 'three-mesh-bvh';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {intakePose,A,B} from '../src/intake-linkage.ts';
const groups=JSON.parse(fs.readFileSync('src/intake-groups.json'));
const pidGroup=new Map(['upper','lower','coupler','pin'].flatMap(k=>groups[k].map(id=>[id,k])));
const buf=fs.readFileSync('public/models/cybercats.glb');
const root=(await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'')).scene;root.updateMatrixWorld(true);
const buckets=new Map();
const joint=(v)=>Math.abs(v.x)>.28&&[A,B].some(p=>Math.hypot(v.y-p[1],v.z-p[2])<.045);
root.traverse(o=>{if(!o.isMesh)return;const g=o.geometry,p=g.attributes.position,ids=g.attributes._partid,idx=g.index;
 for(let i=0;i<(idx?.count??p.count);i+=3){const ix=[0,1,2].map(k=>idx?idx.getX(i+k):i+k),pid=ids.getX(ix[0]),key=pidGroup.get(pid)??'fixed';
  const v=ix.map(i=>new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));
  // Exempt only the physical A/B bearing interfaces, not whole contacting parts or assemblies.
  if(key==='fixed'&&v.every(joint))continue;
  if(!buckets.has(key))buckets.set(key,{positions:[],pids:[]});const b=buckets.get(key);v.forEach(p=>b.positions.push(...p.toArray()));b.pids.push(pid);
 }
});
const bodies={};for(const [key,b]of buckets){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.positions,3));g.setIndex(Array.from({length:b.positions.length/3},(_,i)=>i));bodies[key]={g,bvh:new MeshBVH(g,{indirect:true,targetLeafSize:6}),pids:b.pids};}
const matrix=p=>new T.Matrix4().makeTranslation(...p.position).multiply(new T.Matrix4().makeRotationX(p.angle)).multiply(new T.Matrix4().makeTranslation(...p.pivot.map(x=>-x)));
const samples=[];
for(let deg=0;deg<=74;deg+=.5){
 let p;try{p=intakePose(deg);}catch{samples.push({deg,binding:true});break;}
 const hits={};let minY=Infinity,minZ=Infinity,maxY=-Infinity;
 for(const key of ['upper','lower','coupler','pin']){
  const m=matrix(p[key]),body=bodies[key],pos=body.g.attributes.position,v=new T.Vector3();for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i).applyMatrix4(m);minY=Math.min(minY,v.y);maxY=Math.max(maxY,v.y);minZ=Math.min(minZ,v.z);}
  const pairs=new Set();bodies.fixed.bvh.bvhcast(body.bvh,m,{intersectsTriangles:(a,b,ia,ib)=>{if(a.intersectsTriangle(b)){pairs.add(`${bodies.fixed.pids[bodies.fixed.bvh.resolveTriangleIndex(ia)]}/${body.pids[body.bvh.resolveTriangleIndex(ib)]}`);if(pairs.size>100)return true;}return false;}});
  if(pairs.size)hits[key]=[...pairs];
 }
 const moving=['upper','lower','coupler','pin'];
 for(let i=0;i<moving.length;i++)for(let j=i+1;j<moving.length;j++){
  const ka=moving[i],kb=moving[j],ba=bodies[ka],bb=bodies[kb],ma=matrix(p[ka]),mb=matrix(p[kb]),relative=ma.clone().invert().multiply(mb),pairs=new Set();
  const hinge=ka==='upper'&&kb==='coupler'?p.C:ka==='lower'&&kb==='coupler'?p.D:ka==='upper'&&kb==='pin'?p.F:ka==='lower'&&kb==='pin'?p.E:null;
  ba.bvh.bvhcast(bb.bvh,relative,{intersectsTriangles:(a,b,ia,ib)=>{
   const line=new T.Line3();if(!a.intersectsTriangle(b,line,true))return false;
   const points=[];
   if(line.start.lengthSq()+line.end.lengthSq()>1e-15)points.push(line.start,line.end);
   else { // Coplanar bearing contact: shared vertices and crossing edges bound the overlap.
    for(const [u,v]of [[a,b],[b,a]])for(const x of [u.a,u.b,u.c])if(v.closestPointToPoint(x,new T.Vector3()).distanceTo(x)<1e-6)points.push(x.clone());
    for(const [u,v]of [[a,b],[b,a]])for(const [x,y]of [[u.a,u.b],[u.b,u.c],[u.c,u.a]]){
     const segment=new T.Line3(x,y),p1=new T.Vector3(),p2=new T.Vector3();
     if(v.closestPointToSegment(segment,p1,p2)<1e-6)points.push(p1);
    }
   }
   const near=x=>{const v=x.clone().applyMatrix4(ma);return hinge&&Math.abs(v.x)>.25&&Math.hypot(v.y-hinge[1],v.z-hinge[2])<.04;};
   if(points.length&&points.every(near))return false;
   pairs.add(`${ba.pids[ba.bvh.resolveTriangleIndex(ia)]}/${bb.pids[bb.bvh.resolveTriangleIndex(ib)]}`);return pairs.size>100;
  }});if(pairs.size)hits[`${ka}/${kb}`]=[...pairs];
 }
 const sample={deg,minY,minZ,maxY,slot:p.slotDistance,closure:p.closureHeight,hits};samples.push(sample);console.log(deg,JSON.stringify(sample));
}
const baseline=new Set(Object.values(samples[0].hits).flat());
const newInterference=samples.flatMap(s=>Object.entries(s.hits).flatMap(([body,pairs])=>pairs.filter(p=>!baseline.has(p)).map(pair=>({degrees:s.deg,body,pair}))));
fs.writeFileSync('test-results/cybercats/intake-sweep.json',JSON.stringify({note:'Original CAD triangle surface sweep against fixed parts at exported shooter pose AND between all moving linkage bodies. A/B bearing regions within 45 mm and C/D/F/E joint faces within 40 mm are exempt. Half-degree discrete samples; not a continuous-clearance or physical hard-stop certification.',baseline:[...baseline],newInterference,samples},null,2));
if(newInterference.length)process.exitCode=1;
