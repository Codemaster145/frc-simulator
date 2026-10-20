import * as THREE from 'three';
import type {PartsFile} from './parts';
export interface CadMotion {id:string;name:string;subsystem:string;parent?:string;pivot:[number,number,number];axis:[number,number,number];nodes?:number[];parts?:number[];min:number;max:number;hidden?:boolean;continuous?:boolean;drive?:{id:string;ratio:number};chainIndex?:number;intakeBody?:'upper'|'lower'|'coupler'|'pin';states?:Record<string,number>;}
export function correctCadClassification(parts:PartsFile):void{
 const swerve=parts.subsystems.indexOf('swerve'),shooter=parts.subsystems.indexOf('turrets');
 for(let i=0;i<parts.tree.length;i++){
  if(parts.tree[i][3]!==shooter)continue;
  for(let n=i;n>=0;n=parts.tree[n][1])if(/^(vroom VROOM|SDS MK4n)$/i.test(parts.names[parts.tree[n][0]])){parts.tree[i][3]=swerve;break;}
 }
}

/** Split triangles by their retained part IDs, preserving compressed attributes and mesh transforms.
 * Pivot/negative-offset pairs keep coordinates in the original CAD frame. They also let the
 * viewer's existing part boxes, selection, explode and nested rotation machinery keep working.
 * These are visual meshes only: the simulation builds its demo colliders separately.
 */
export function rigCadModel(model:THREE.Object3D,parts:PartsFile,motions:CadMotion[]):THREE.Object3D{
 correctCadClassification(parts);
 const defs=new Map(motions.map(m=>[m.id,m]));
 const chains=new Map<string,CadMotion[]>();
 function chain(m:CadMotion,seen=new Set<string>()):CadMotion[]{
  if(seen.has(m.id))throw new Error(`Cyclic CAD motion ${m.id}`);
  seen.add(m.id);
  const parent=m.parent?defs.get(m.parent):null;
  if(m.parent&&!parent)throw new Error(`Missing CAD parent ${m.parent}`);
  return [...(parent?chain(parent,seen):[]),m];
 }
 const selected=new Map<string,Set<number>>();
 for(const m of motions){
  if(!Number.isFinite(Math.hypot(...m.axis))||Math.hypot(...m.axis)<.99||!m.pivot.every(Number.isFinite))throw new Error(`Invalid CAD axis/pivot ${m.id}`);
  chains.set(m.id,chain(m));const ids=new Set(m.parts??[]);
  for(let pid=1;pid<parts.partNode.length;pid++)for(let n=parts.partNode[pid];n>=0;n=parts.tree[n][1])if(m.nodes?.includes(n)){ids.add(pid);break;}
  for(const id of ids)if(id<1||id>=parts.partNode.length)throw new Error(`Unknown CAD part ${id}`);
  selected.set(m.id,ids);
 }
 const motionOf=new Map<number,string>();
 for(let pid=1;pid<parts.partNode.length;pid++){
  const matches=motions.filter(m=>selected.get(m.id)!.has(pid)).sort((a,b)=>chains.get(b.id)!.length-chains.get(a.id)!.length);
  if(matches.length){
   const chosen=matches[0],path=chains.get(chosen.id)!;
   if(matches.some(m=>!path.includes(m)))throw new Error(`Conflicting CAD motions for part ${pid}`);
   motionOf.set(pid,chosen.id);
  }
 }
 parts.mechanisms=motions.map(m=>m.id);
 for(let pid=1;pid<parts.partNode.length;pid++)parts.tree[parts.partNode[pid]][4]=parts.mechanisms.indexOf(motionOf.get(pid)??'');
 const root=new THREE.Group();root.name='CyberCats rig';
 const subs=new Map<string,THREE.Group>(),parents=new Map<string,THREE.Object3D>();
 function parentFor(sub:string,motion?:string):THREE.Object3D{
  let parent=subs.get(sub);
  if(!parent){parent=new THREE.Group();parent.userData={subsystem:sub};parent.name=`subsystem:${sub}`;subs.set(sub,parent);root.add(parent);}
  let p:THREE.Object3D=parent;
  for(const m of motion?chains.get(motion)!:[]){
   const key=`${sub}/${m.id}`;
   if(!parents.has(key)){
    const pivot=new THREE.Group(),offset=new THREE.Group();pivot.name=m.name;
    pivot.position.fromArray(m.pivot);offset.position.fromArray(m.pivot).negate();
    pivot.userData={mechanism:m.id,name:m.name,axis:m.axis,type:'rotate',min:m.min,max:m.max,default:0,hidden:!!m.hidden,continuous:!!m.continuous,drive:m.drive,chainIndex:m.chainIndex,intakeBody:m.intakeBody,states:m.states,role:m.intakeBody?'intake':m.chainIndex===undefined?'rotate':'chain'};
    p.add(pivot);pivot.add(offset);parents.set(key,offset);
   }
   p=parents.get(key)!;
  }
  return p;
 }
 model.updateMatrixWorld(true);
 model.traverse(o=>{
  if(!(o instanceof THREE.Mesh))return;
  const g=o.geometry as THREE.BufferGeometry,ids=g.getAttribute('_partid')??g.getAttribute('_PARTID');
  if(!ids)throw new Error('CAD mesh has no selectable part IDs');
  const count=g.index?.count??ids.count,buckets=new Map<string,{sub:string;motion?:string;indices:number[]}>();
  for(let i=0;i<count;i+=3){
   const tri=[0,1,2].map(k=>g.index?g.index.getX(i+k):i+k),pid=ids.getX(tri[0]);
   if(tri.some(v=>ids.getX(v)!==pid))throw new Error('CAD triangle crosses part identities');
   const node=parts.partNode[pid],sub=parts.subsystems[parts.tree[node][3]],motion=motionOf.get(pid),key=`${sub}/${motion??''}`;
   if(!buckets.has(key))buckets.set(key,{sub,motion,indices:[]});buckets.get(key)!.indices.push(...tri);
  }
  for(const {sub,motion,indices} of buckets.values()){
   const remap=new Map<number,number>(),used:number[]=[],index:number[]=[];
   for(const old of indices){if(!remap.has(old)){remap.set(old,used.length);used.push(old);}index.push(remap.get(old)!);}
   const geometry=new THREE.BufferGeometry();
   for(const [name,attr] of Object.entries(g.attributes)){
    // glTF attributes may be interleaved or normalized; copying their raw components retains both.
    const source=attr instanceof THREE.InterleavedBufferAttribute?attr.data.array:attr.array;
    const ArrayType=source.constructor as {new(length:number):THREE.TypedArray};
    const array=new ArrayType(used.length*attr.itemSize);
    used.forEach((old,j)=>{for(let k=0;k<attr.itemSize;k++)array[j*attr.itemSize+k]=source[attr instanceof THREE.InterleavedBufferAttribute?old*attr.data.stride+attr.offset+k:old*attr.itemSize+k];});
    geometry.setAttribute(name.toLowerCase(),new THREE.BufferAttribute(array,attr.itemSize,attr.normalized));
   }
   geometry.setIndex(index);
   const mesh=new THREE.Mesh(geometry,o.material);mesh.name=o.name;mesh.matrix.copy(o.matrixWorld);mesh.matrixAutoUpdate=false;
   mesh.userData={...o.userData,subsystem:sub,collision:false,cadPartition:true};parentFor(sub,motion).add(mesh);
  }
 });
 return root;
}
