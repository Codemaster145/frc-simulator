export function createCadTransform({ yawDegrees, groundZ }) {
  if (!Number.isFinite(yawDegrees) || !Number.isFinite(groundZ)) throw new Error('Explicit CAD yaw and ground reference required');
  const angle = yawDegrees * Math.PI / 180, c = Math.cos(angle), s = Math.sin(angle);
  const vector = ([x, y, z]) => [c * x + s * y, z, s * x - c * y];
  return { vector, point: p => { const v = vector(p); v[1] -= groundZ; return v; } };
}
export function cadColor(_names, rgba) { return rgba.slice(0, 3); }
