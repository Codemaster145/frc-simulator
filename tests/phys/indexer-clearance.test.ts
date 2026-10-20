import {test,expect} from 'vitest';
import fs from 'node:fs';
import * as T from 'three';
import {MeshBVH} from 'three-mesh-bvh';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import rotor from '../../src/indexer-rotor.json';
import chain from '../../src/cad-chain.json';

test('V2 rotor has no new surface interference through a sampled revolution in the deployed CAD pose',async()=>{
 const ids=new Set([...rotor.carrier,...Array.from({length:11},(_,i)=>1336+i)]);
 // The moving chain intentionally engages the sprocket. A static-chain sweep would
 // report tooth/link engagement as a new collision; its path is checked separately.
 const chainIds=new Set(chain.links.map(l=>l.pid));
 const buf=fs.readFileSync('public/models/cybercats.glb'),root=(await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'')).scene;root.updateMatrixWorld(true);
 const buckets=[{vertices:[] as number[],pids:[] as number[]},{vertices:[] as number[],pids:[] as number[]}];
 root.traverse(o=>{if(!(o instanceof T.Mesh))return;const g=o.geometry,p=g.attributes.position,part=g.attributes._partid,idx=g.index;
  for(let i=0;i<(idx?.count??p.count);i+=3){const ix=[0,1,2].map(k=>idx?idx.getX(i+k):i+k),id=part.getX(ix[0]);if(chainIds.has(id))continue;const b=buckets[ids.has(id)?0:1];for(const j of ix)b.vertices.push(...new T.Vector3().fromBufferAttribute(p,j).applyMatrix4(o.matrixWorld).toArray());b.pids.push(id);}
 });
 const bodies=buckets.map(b=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.vertices,3));return {bvh:new MeshBVH(g,{indirect:true}),pids:b.pids};});
 const [a,b]=bodies,p=rotor.axisPoint as [number,number,number];
 const pairsAt=(degrees:number)=>{const m=new T.Matrix4().makeTranslation(...p).multiply(new T.Matrix4().makeRotationY(-degrees*Math.PI/180)).multiply(new T.Matrix4().makeTranslation(...p.map(v=>-v) as [number,number,number]));const pairs=new Set<string>();
  a.bvh.bvhcast(b.bvh,m,{intersectsTriangles:(ta,tb,ia,ib)=>{const key=`${a.pids[a.bvh.resolveTriangleIndex(ia)]}/${b.pids[b.bvh.resolveTriangleIndex(ib)]}`;if(!pairs.has(key)&&ta.intersectsTriangle(tb))pairs.add(key);return false;}});return pairs;};
 const baseline=pairsAt(0),newInterference=[];
 for(let angle=15;angle<360;angle+=15){const pairs=[...pairsAt(angle)].filter(p=>!baseline.has(p));if(pairs.length)newInterference.push({angle,pairs});}
 fs.writeFileSync('test-results/cybercats/indexer-clearance.json',JSON.stringify({note:'Original triangle surface intersections, 15-degree samples; other mechanisms in exported deployed pose. Moving chain excluded (intentional tooth/link engagement); existing contacts excluded. Not a continuous clearance or hardware certification.',baseline:[...baseline],newInterference},null,2));
 expect(newInterference).toEqual([]);
},120000);
