import * as THREE from 'three';

/** World-space translations for intact CAD assembly roots. Bounds are measured in the assembled pose. */
export function planExplodedLayout(boxes: ReadonlyMap<string, THREE.Box3>): Map<string, THREE.Vector3> {
  const moves = new Map([...boxes.keys()].map(id => [id, new THREE.Vector3()]));
  const drive = boxes.get('swerve'), frame = boxes.get('frame');
  if (!drive && !frame) return moves;

  const core = (drive ?? frame)!.clone();
  if (frame) core.union(frame);
  const width = core.getSize(new THREE.Vector3()).x;
  const gap = THREE.MathUtils.clamp(width * 0.18, 0.11, 0.22);
  const verticalGap = THREE.MathUtils.clamp(width * 0.09, 0.06, 0.10);
  const driveTop = drive?.max.y ?? core.min.y;

  // The bumper/chassis rises clear of the four swerve modules, leaving both at the center.
  if (drive && frame) moves.get('frame')!.y = Math.max(0, driveTop + verticalGap - frame.min.y);

  const intake = boxes.get('intake');
  if (intake) {
    const move = moves.get('intake')!;
    move.x = core.min.x - gap - intake.max.x;
    move.y = Math.max(0, driveTop + verticalGap * 1.7 - intake.min.y);
  }
  const shooter = boxes.get('turrets');
  if (shooter) {
    const move = moves.get('turrets')!;
    move.x = core.max.x + gap - shooter.min.x;
    move.y = Math.max(0, driveTop + verticalGap * 1.9 - shooter.min.y);
  }

  // Keep the two inboard assemblies beside one another, behind the central chassis.
  const rear = ['electrical', 'indexer'].filter(id => boxes.has(id));
  const rearGap = gap * 0.8;
  const totalWidth = rear.reduce((sum, id) => sum + boxes.get(id)!.getSize(new THREE.Vector3()).x, 0)
    + rearGap * Math.max(0, rear.length - 1);
  let left = core.getCenter(new THREE.Vector3()).x - totalWidth / 2;
  for (const id of rear) {
    const box = boxes.get(id)!, move = moves.get(id)!;
    move.x = left - box.min.x;
    move.y = Math.max(0, driveTop + verticalGap * 0.6 - box.min.y);
    move.z = core.max.z + gap - box.min.z;
    left += box.getSize(new THREE.Vector3()).x + rearGap;
  }
  return moves;
}
