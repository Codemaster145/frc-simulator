// The robot's shooting "code": distance → (flywheel speed, hood angle, time of flight) lookup
// tables, the way real teams aim. The tables are solved here, offline (once, ~20 ms), by flying the
// ball through the same model the simulation uses: gravity, drag, Magnus lift from the shooter's
// backspin, and spin decay. Nothing in flight is ever corrected afterwards.
import { FUEL, G, RHO, SHOOTER } from './config';
import hoodCalibration from '../../hood-calibration.json';
import {ptooeyPose} from '../../ptooey-geometry';

const DEG = Math.PI / 180;
const R = FUEL.radius;
const KD = (0.5 * RHO * FUEL.cd * Math.PI * R * R) / FUEL.mass;
const KL = (0.5 * RHO * Math.PI * R * R) / FUEL.mass;
/** Target opening height; exit height is measured from the current CAD hood pose. */
const HUB_Y = 1.83;

export interface AimSolution { omega: number; hood: number; tof: number }

/** Approved upstream demo exit speed/backspin. Dual-bank energy transfer awaits team calibration. */
export function exitFor(omega: number) {
  const u = omega * SHOOTER.wheelRadius;
  return { speed: (SHOOTER.slip * u) / 2, spin: (SHOOTER.slip * u) / (2 * R) };
}

/**
 * Flies a shot in the vertical plane: returns horizontal distance and time each time the ball
 * crosses `yTarget` going down, or null if it never does.
 */
export function fly(speed: number, pitch: number, spin: number, y0: number, yTarget: number, dt = 1 / 240): { d: number; t: number; apex: number; path: [number, number][] } | null {
  let x = 0, y = y0, vx = speed * Math.cos(pitch), vy = speed * Math.sin(pitch), w = spin, t = 0, apex = y0;
  const path: [number, number][] = [[0, y0]];
  const decay = Math.exp(-dt / FUEL.spinTau);
  while (t < 6) {
    const sp = Math.hypot(vx, vy);
    let ax = -KD * sp * vx, ay = -G - KD * sp * vy;
    if (w > 1 && sp > 0.5) {
      const S = (R * w) / sp;
      const cl = FUEL.liftScale / (FUEL.liftA + FUEL.liftB / S);
      // backspin: lift is perpendicular to v, rotated +90° (up for a forward shot)
      ax += KL * cl * sp * -vy;
      ay += KL * cl * sp * vx;
    }
    const nvy = vy + ay * dt;
    const ny = y + nvy * dt;
    const nx = x + (vx + ax * dt) * dt;
    if (nvy < 0 && y >= yTarget && ny < yTarget) {
      const f = (y - yTarget) / (y - ny);
      path.push([x + (nx - x) * f, yTarget]);
      return { d: x + (nx - x) * f, t: t + dt * f, apex, path };
    }
    vx += ax * dt; vy = nvy; x = nx; y = ny; w *= decay; t += dt;
    apex = Math.max(apex, y);
    if ((t * 240) % 6 < 1) path.push([x, y]);
    if (y < -1) return null;
  }
  return null;
}

export class AimTable {
  private static inst: AimTable | null = null;
  static shared() { return (AimTable.inst ??= new AimTable()); }

  readonly maxOmega = 600;          // rad/s the flywheel holds under load (≈5700 rpm). EDIT
  readonly hub: { d: number; sol: AimSolution }[] = [];
  readonly ferry: { d: number; sol: AimSolution }[] = [];
  private manual = new Map<string, AimSolution | null>();

  constructor() {
    // HUB: steeper up close (the hood drops as distance grows), descending through the opening's plane at the HUB's center
    for (let d = 1.3; d <= 7.5 + 1e-6; d += 0.1) {
      const hood = this.hoodAt(d)*DEG;
      const s = this.solve(hood, HUB_Y, d);
      if (s) this.hub.push({ d, sol: s });
    }
    // ferry: a high lob at the hood's lowest setting, landing on the carpet
    for (let d = 2; d <= 16 + 1e-6; d += 0.25) {
      const s = this.solve(hoodCalibration.ferryDegrees * DEG, R, d);
      if (s) this.ferry.push({ d, sol: s });
    }
  }

  hoodAt(distance:number){
    const points=hoodCalibration.hub;let k=0;while(k<points.length-2&&points[k+1][0]<distance)k++;
    const a=points[k],b=points[k+1]??a,u=Math.max(0,Math.min(1,(distance-a[0])/(b[0]-a[0]||1)));
    return Math.max(SHOOTER.hoodMin,Math.min(SHOOTER.hoodMax,a[1]+(b[1]-a[1])*u));
  }

  /** Bisection on flywheel speed for a given hood angle so the ball comes down through yTarget at distance d. */
  private solve(hood: number, yTarget: number, d: number): AimSolution | null {
    let lo = 60, hi = this.maxOmega, best: AimSolution | null = null;
    for (let k = 0; k < 24; k++) {
      const om = (lo + hi) / 2;
      const e = exitFor(om);
      const r = fly(e.speed, hood, e.spin, ptooeyPose(0,hood).origin[1], yTarget);
      if (!r || r.d < d) lo = om; else { hi = om; best = { omega: om, hood, tof: r.t }; }
    }
    if (!best || hi >= this.maxOmega - 1) return null;
    return best;
  }

  lookup(kind: 'hub' | 'ferry', d: number, _dh = 0, manualHood: number | null = null): AimSolution | null {
    if (manualHood !== null) {
      // Solve only when the angle or 2 cm distance bin changes, not every 120 Hz physics step.
      const distance = Math.round(d * 50) / 50, key = `${kind}:${manualHood}:${distance}`;
      if (!this.manual.has(key)) {
        if (this.manual.size >= 512) this.manual.clear();
        this.manual.set(key, this.solve(manualHood, kind === 'hub' ? HUB_Y : R, distance));
      }
      return this.manual.get(key)!;
    }
    const tab = kind === 'hub' ? this.hub : this.ferry;
    if (!tab.length || d < tab[0].d - 0.05 || d > tab[tab.length - 1].d + 0.05) return null;
    let k = 0;
    while (k < tab.length - 2 && tab[k + 1].d < d) k++;
    const a = tab[k], b = tab[k + 1] ?? a;
    const f = b.d === a.d ? 0 : Math.max(0, Math.min(1, (d - a.d) / (b.d - a.d)));
    return { omega: a.sol.omega + (b.sol.omega - a.sol.omega) * f, hood: a.sol.hood + (b.sol.hood - a.sol.hood) * f, tof: a.sol.tof + (b.sol.tof - a.sol.tof) * f };
  }
}
