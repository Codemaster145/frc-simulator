// Measure circular boundaries on the original flat CAD plates; no motion inferred from names alone.
import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
const buf=fs.readFileSync('public/models/cybercats.glb');
const root=(await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'')).scene;
root.updateMatrixWorld(true);
const wanted=new Set([677,686,682,706,667,749,705,742,2046,2098]),triangles=new Map();
root.traverse(o=>{
 if(!o.isMesh)return;const g=o.geometry,p=g.getAttribute('position'),ids=g.getAttribute('_partid'),idx=g.index;
 for(let k=0;k<(idx?.count??p.count);k+=3){const ix=[0,1,2].map(j=>idx?idx.getX(k+j):k+j),pid=ids.getX(ix[0]);if(!wanted.has(pid))continue;
  const vs=ix.map(i=>new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));
  const norm=vs[1].clone().sub(vs[0]).cross(vs[2].clone().sub(vs[0])).normalize();if(Math.abs(norm.x)<.999)continue;
  const sign=Math.sign(norm.x),key=`${pid}:${sign}`;if(!triangles.has(key))triangles.set(key,[]);triangles.get(key).push(vs);
 }
});
const result={};
for(const [key,tris] of triangles){
 const points=new Map(),edges=new Map(),round=v=>v.toArray().map(x=>Math.round(x*1e5)).join(',');
 for(const t of tris){for(let j=0;j<3;j++){const a=round(t[j]),b=round(t[(j+1)%3]);points.set(a,t[j]);points.set(b,t[(j+1)%3]);const k=[a,b].sort().join('|');if(edges.has(k))edges.delete(k);else edges.set(k,[a,b]);}}
 const adj=new Map();for(const [a,b] of edges.values()){if(!adj.has(a))adj.set(a,[]);if(!adj.has(b))adj.set(b,[]);adj.get(a).push(b);adj.get(b).push(a);}
 const seen=new Set(),loops=[];
 for(const start of adj.keys()){if(seen.has(start))continue;let here=start,prev=null;const ids=[];for(let it=0;it<10000;it++){if(seen.has(here))break;seen.add(here);ids.push(here);const next=adj.get(here)?.find(x=>x!==prev);prev=here;here=next;if(!here)break;}
  if(here!==start||ids.length<7)continue;
  const ps=ids.map(id=>points.get(id)),c=ps.reduce((s,v)=>s.add(v),new T.Vector3()).multiplyScalar(1/ps.length);
  const radii=ps.map(p=>Math.hypot(p.y-c.y,p.z-c.z)),radius=radii.reduce((s,r)=>s+r,0)/radii.length,error=Math.max(...radii)-Math.min(...radii);
  if(error<.001&&radius>.002)loops.push({center:c.toArray(),radius,error,vertices:ps.length});
  else if(key.startsWith('705'))loops.push({center:c.toArray(),radius,error,points:ps.map(p=>p.toArray())});
 }
 result[key]=loops;
}
fs.writeFileSync('test-results/cybercats/linkage-holes.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,1));
