// Measured CAD shaft centers. The team confirmed the M–U passage and upward exit on 2026-10-18.
// Coordinates are canonical CAD meters, before the shared CAD-to-body transform.
export type V3=[number,number,number];
export const TURRET_PIVOT:V3=[.006337300168955114,.3393053916515788,0];
export const MAIN_CENTER:V3=[.00615424922470225,.4457745967665707,-.10185383175518722];
export const SHOOTER_AXIS:V3=[.999999936866,0,.0003553436];
export const UPPER_CENTER:V3=[MAIN_CENTER[0],.5514747319975888,.0717317835];
export const LOWER_CENTER:V3=[MAIN_CENTER[0],.49114797721193276,.0961154193];
export const MAIN_RADIUS=.0508,UPPER_RADIUS=.0254;
const sub=(a:V3,b:V3):V3=>a.map((v,i)=>v-b[i]) as V3;
const add=(a:V3,b:V3):V3=>a.map((v,i)=>v+b[i]) as V3;
const scale=(a:V3,k:number):V3=>a.map(v=>v*k) as V3;
const dot=(a:V3,b:V3)=>a.reduce((s,v,i)=>s+v*b[i],0);
const cross=(a:V3,b:V3):V3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const delta=sub(UPPER_CENTER,MAIN_CENTER),distance=Math.hypot(...delta);
const normal=scale(delta,1/distance);
const direction=scale(cross(SHOOTER_AXIS,normal),-1);
export const REST_PITCH=Math.asin(direction[1]);
export const REST_YAW=Math.atan2(direction[0],direction[2]);
const throat=add(MAIN_CENTER,scale(normal,(distance+MAIN_RADIUS-UPPER_RADIUS)/2));
export function rotateAxis(v:V3,axis:V3,a:number):V3{
 const c=Math.cos(a),s=Math.sin(a);return add(add(scale(v,c),scale(cross(axis,v),s)),scale(axis,dot(axis,v)*(1-c)));
}
export function turretPoint(point:V3,yaw:number):V3{return add(TURRET_PIVOT,rotateAxis(sub(point,TURRET_PIVOT),[0,1,0],yaw));}
export function hoodPoint(point:V3,pitch:number):V3{return add(MAIN_CENTER,rotateAxis(sub(point,MAIN_CENTER),SHOOTER_AXIS,pitch-REST_PITCH));}
/** One physical gap. Release only after the full FUEL sphere clears both wheel envelopes. */
export function ptooeyPose(yaw:number,pitch:number,radius=.075){
 const clearance=Math.max(...[[MAIN_CENTER,MAIN_RADIUS],[UPPER_CENTER,UPPER_RADIUS]].map(([c,r])=>Math.sqrt(Math.max(0,((r as number)+radius+.003)**2-Math.hypot(...sub(throat,c as V3))**2))))+.006;
 const release=add(throat,scale(direction,clearance));
 const dir=rotateAxis(rotateAxis(direction,SHOOTER_AXIS,pitch-REST_PITCH),[0,1,0],yaw);
 return {origin:turretPoint(hoodPoint(release,pitch),yaw),direction:dir,
  throat:turretPoint(hoodPoint(throat,pitch),yaw),entry:turretPoint(hoodPoint(add(throat,scale(direction,-.09)),pitch),yaw),
  main:turretPoint(MAIN_CENTER,yaw),upper:turretPoint(hoodPoint(UPPER_CENTER,pitch),yaw),lower:turretPoint(hoodPoint(LOWER_CENTER,pitch),yaw),
  axis:rotateAxis(SHOOTER_AXIS,[0,1,0],yaw)};
}
