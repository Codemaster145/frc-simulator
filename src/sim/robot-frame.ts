import profile from '../robot-profile.json';

// Keep the original simulator's intake-facing body frame. The real robot's front is opposite
// the intake. Apply this SAME rigid rotation to the visual CAD and its mass-property point.
// This preserves upstream feed/collision calculations without treating rear intake as front.
export const CAD_TO_BODY_YAW = profile.physics.modelYawDegrees * Math.PI / 180;
export function cadPointToBody([x, y, z]: number[]): [number, number, number] {
  const c = Math.cos(CAD_TO_BODY_YAW), s = Math.sin(CAD_TO_BODY_YAW);
  return [c * x + s * z, y, -s * x + c * z];
}
