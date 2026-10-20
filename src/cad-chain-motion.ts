import data from './cad-chain.json';
export const CHAIN_POINTS=data.links.map(l=>l.center);
const lengths=CHAIN_POINTS.map((p,i)=>Math.hypot(...p.map((x,k)=>x-CHAIN_POINTS[(i+1)%CHAIN_POINTS.length][k])));
const offsets=[0];for(const l of lengths)offsets.push(offsets.at(-1)!+l);
export const CHAIN_LENGTH=offsets.at(-1)!;
const mod=(x:number,n:number)=>((x%n)+n)%n;
function tangent(i:number){const a=CHAIN_POINTS[mod(i-1,CHAIN_POINTS.length)],b=CHAIN_POINTS[(i+1)%CHAIN_POINTS.length];return Math.atan2(b[0]-a[0],b[2]-a[2]);}
/** Follow the exported link centerline, preserving each link as a rigid original CAD part. */
export function chainPose(index:number,travel:number){
 const s=mod(offsets[index]+travel,CHAIN_LENGTH);let j=0;while(j<lengths.length-1&&offsets[j+1]<=s)j++;
 const u=(s-offsets[j])/lengths[j],a=CHAIN_POINTS[j],b=CHAIN_POINTS[(j+1)%CHAIN_POINTS.length];
 const ta=tangent(j),tb=tangent(j+1),da=Math.atan2(Math.sin(tb-ta),Math.cos(tb-ta));
 return {position:a.map((x,k)=>x+(b[k]-x)*u),angle:ta+da*u-tangent(index)};
}
/** Sign of travel around the measured circuit for positive rotation about +Y. */
export function sprocketSign(center:number[]){
 let best=0,d=Infinity;CHAIN_POINTS.forEach((p,i)=>{const r=Math.hypot(p[0]-center[0],p[2]-center[2]);if(r<d){d=r;best=i;}});
 const p=CHAIN_POINTS[best],a=tangent(best);
 return Math.sign((p[2]-center[2])*Math.sin(a)-(p[0]-center[0])*Math.cos(a));
}
// Geometry from the named 12T #35 sprocket. This is angular coupling, not a motor-speed specification.
export const CHAIN_TRAVEL_PER_RADIAN=sprocketSign(data.shafts.motor.center)*12*.009525/(2*Math.PI);
