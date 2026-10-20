import * as THREE from 'three';
import type {Frame} from './backend';
import {CAD_REVIEW_AXES} from '../cad-motions';

/** Temporary ?debug=mechanisms inspection: ray data comes from the actual launch function. */
export class MechanismDebug {
 private rays:THREE.ArrowHelper[]=[];
 private axes=new THREE.Group();
 private label=document.createElement('div');
 constructor(private field:THREE.Group,root:THREE.Object3D){
  for(const [id,axis] of Object.entries(CAD_REVIEW_AXES))this.axes.add(this.arrow(axis.pivot,axis.axis,.3,id==='turret'?0xffb938:0x38ddff));
  root.add(this.axes);this.label.className='mechanism-debug';
  this.label.style.cssText='position:absolute;left:12px;bottom:14px;z-index:50;max-width:460px;font:12px/1.5 system-ui;color:white;background:#101820e8;padding:10px;border:1px solid #ffb938;pointer-events:none';
  document.getElementById('ui')?.append(this.label);
 }
 private arrow(p:number[],d:number[],len:number,color:number){
  const a=new THREE.ArrowHelper(new THREE.Vector3(...d).normalize(),new THREE.Vector3(...p),len,color,.05,.025);
  a.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){(o.material as THREE.Material).depthTest=false;o.renderOrder=110;}});return a;
 }
 update(fr:Frame){
  while(this.rays.length<fr.robot.turrets.length){const a=this.arrow([0,0,0],[0,1,0],.5,0x44ff88);this.rays.push(a);this.field.add(a);}
  this.rays.forEach((a,i)=>{const t=fr.robot.turrets[i];a.visible=!!t;if(t){a.position.fromArray(t.origin);a.setDirection(new THREE.Vector3(...t.direction).normalize());}});
  this.label.textContent=`Green: ${fr.robot.turrets.length} actual M–U projectile origin/direction. Amber: turret axis. Cyan: confirmed indexer driven axis. Hood calibration and feed speed are temporary demo values.`;
 }
 dispose(){for(const a of this.rays){a.removeFromParent();a.dispose();}this.axes.traverse(o=>{if(o instanceof THREE.ArrowHelper)o.dispose();});this.axes.removeFromParent();this.label.remove();}
}
