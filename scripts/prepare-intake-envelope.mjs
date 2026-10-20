import fs from 'node:fs';
import * as T from 'three';
import {ConvexHull} from 'three/examples/jsm/math/ConvexHull.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {C} from '../src/intake-linkage.ts';
const ids=new Set(JSON.parse(fs.readFileSync('src/intake-groups.json')).coupler),buf=fs.readFileSync('public/models/cybercats.glb');
const root=(await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'')).scene;root.updateMatrixWorld(true);
const points=new Map();root.traverse(m=>{if(!m.isMesh)return;const g=m.geometry,p=g.attributes.position,id=g.attributes._partid;for(let i=0;i<p.count;i++)if(ids.has(id.getX(i))){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);points.set(v.toArray().map(x=>x.toFixed(6)).join(','),v);}});
const hull=new ConvexHull().setFromPoints([...points.values()]),vertices=new Set();for(const face of hull.faces){let edge=face.edge;do{vertices.add(edge.head().point);edge=edge.next;}while(edge!==face.edge);}
const bodyVertices=[...vertices].flatMap(p=>[-p.x,p.y-C[1],-p.z+C[2]]);
fs.writeFileSync('src/intake-envelope.json',JSON.stringify({note:'Convex field-contact envelope of the actual original Coupler part vertices, in body coordinates relative to joint C. Retains actual outer extents; fills interior voids. FUEL feed contacts remain demo approximations.',parts:ids.size,bodyVertices},null,2));
console.log('Actual CAD intake envelope vertices',vertices.size);
