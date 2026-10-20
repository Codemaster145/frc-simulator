// Canonical CAD coordinates (metres), measured shaft centers and matching plate holes.
// Current export is the team-confirmed fully deployed reference, 0 degrees.
export type Point = [number, number, number];
export const A: Point = [0, .2343714057, -.2175597975];
export const B: Point = [0, .1708714186, -.3238500007];
export const C: Point = [0, .2630, -.5304];
export const D: Point = [0, .1551, -.6237];
export const F: Point = [0, .2509, -.4005]; // upper-arm bearing, rear roller support
export const E: Point = [0, .1650, -.4364]; // lower-arm shoulder pin in the rear support's slot
export const ROLLER_CENTERS: Point[] = [[0,.1551,-.6237],[0,.2061,-.5836],C,[0,.0554,-.4823]];
const distance = (a:Point,b:Point) => Math.hypot(a[1]-b[1],a[2]-b[2]);
const direction = (a:Point,b:Point) => Math.atan2(a[2]-b[2],a[1]-b[1]);
export function around(point:Point,pivot:Point,angle:number):Point {
 const y=point[1]-pivot[1],z=point[2]-pivot[2],c=Math.cos(angle),s=Math.sin(angle);
 return [point[0],pivot[1]+y*c-z*s,pivot[2]+y*s+z*c];
}
export interface IntakeBodyPose { pivot:Point; position:Point; angle:number }
export function moveIntakePoint(point:Point,pose:IntakeBodyPose):Point {
 const p=around(point,pose.pivot,pose.angle);return [p[0],p[1]+pose.position[1]-pose.pivot[1],p[2]+pose.position[2]-pose.pivot[2]];
}
export function intakePose(degrees:number) {
 const angle=degrees*Math.PI/180,c=around(C,A,angle),r=distance(B,D),s=distance(C,D),d=distance(B,c);
 if(d>r+s||d<Math.abs(r-s)||d<1e-9)throw new Error('Intake linkage cannot close');
 const a=(r*r-s*s+d*d)/(2*d),h=Math.sqrt(Math.max(0,r*r-a*a)),dy=(c[1]-B[1])/d,dz=(c[2]-B[2])/d;
 // The exported branch has D behind the B→C line. Keep this branch; never flip at a toggle.
 const p:Point=[0,B[1]+a*dy+h*dz,B[2]+a*dz-h*dy];
 const lower=direction(p,B)-direction(D,B),coupler=direction(p,c)-direction(D,C);
 const upperPose:IntakeBodyPose={pivot:A,position:A,angle};
 const lowerPose:IntakeBodyPose={pivot:B,position:B,angle:lower};
 const f=moveIntakePoint(F,upperPose),e=moveIntakePoint(E,lowerPose);
 const pin=direction(e,f)-direction(E,F);
 const poses={upper:upperPose,lower:lowerPose,coupler:{pivot:C,position:c,angle:coupler},pin:{pivot:F,position:f,angle:pin}};
 return {...poses,C:c,D:p,F:f,E:e,slotDistance:distance(e,f),closureHeight:h,
  rollers:ROLLER_CENTERS.map((p,i)=>moveIntakePoint(p,i===3?poses.pin:poses.coupler))};
}
