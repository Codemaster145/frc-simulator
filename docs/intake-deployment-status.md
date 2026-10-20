# Mechanism status — 2026-10-19

Continued the saved CyberCats project. No source CAD modification, simulator rebuild, or Phase B work.

## Arthritis intake

The actual upper Driver arms and four cycloidal output components move around measured axis A. Lower links use measured B; the Coupler closes A–C–D–B. Rear roller supports follow bearing F and sliding pin E. Gear 754 was corrected to the upper-arm group. Motor cases, stationary gearbox housings and chassis mounts remain fixed. Original roller tubes/endcaps animate with the approved demo roller speed; internal cycloidal eccentric discs are not given an invented motion.

The team-confirmed deployed pose is 0°. Retraction raises the intake smoothly to the **estimated 74°** upper Driver-arm angle. This is not a measured hard stop. Simulation settings can lower the maximum from 74° to 0° and persist it locally. Increasing the audited ceiling requires editing `src/intake-calibration.json` and repeating the geometry audit. Speed (70°/s) and acceleration (240°/s²) remain demo values.

Controls: CAD viewer → Intake or Move → deployment presets/slider. Simulation → Deploy / Retract / Toggle. Existing R toggles the arm; F toggles intake collection. Simulation settings → Estimated intake retraction changes the maximum. Ground collection requires deployed geometry and running rollers.

The field collider now uses a 124-vertex convex envelope generated from actual Coupler geometry, preserving its outer extent while filling interior voids. FUEL contact/feed approximations remain approved demo physics. The original body frame, mass, COM, chassis dimensions and confirmed forward orientation are unchanged.

## Collision evidence and limits

- `scripts/audit-intake-sweep.mjs`: all original intake triangles against fixed robot triangles and between moving intake bodies, every 0.5° from 0° through 74°. No new intersections. Physical bearing interfaces at A/B and actual joints at C/D/F/E are excluded locally, not by ignoring whole parts.
- Existing overlap: Foam part 34 with lower rear-support components 699, 705, 678, 798, 672 and 742 at the deployed pose. It clears near 10°. Original CAD remains unchanged.
- At 74°, measured front extent is −0.414646 m against the CAD foam front at −0.429 m: about 14.4 mm clearance. Highest intake vertex is approximately 0.7488 m. Four-bar closure remains valid; the sliding pin remains within the measured slot.
- `tests/phys/intake-turret-clearance.test.ts`: 2,736 combinations of intake travel at 2° intervals, turret yaw at 15° intervals, and minimum/exported/maximum demo hood settings. No intake/turret/hood triangle intersections.
- These are discrete triangle-surface checks, not a continuous-clearance guarantee or certification of real hardware tolerances, deflection, chain tension, cable routing or hard stops.

## Verification

- Production build: `intake-build.log` (TypeScript, Vite, PWA).
- Full existing physics/CAD-motion suite: 38 tests passed in `intake-all-physics.log`. Includes driving, field collisions, single-outlet shooting/scoring, moving shots, determinism and 60-second AI play.
- Additional combined mechanism clearance test passed in `intake-turret-clearance.log`.
- Focused intake tests: five passed in `intake-pipeline.log`; includes an additional end-to-end floor FUEL → intake → indexer → shooter → HUB test, smooth actuator commands, limit change without teleporting, match disable and deployed-only collection.
- CAD transform/material tests: five passed in `intake-cad.log`.
- The initial raised-intake trench check failed at 13.5 mm contact overlap. Replacing the inherited oversized rectangular envelope with actual-CAD convex geometry fixed it: 9.0 mm, within the unchanged 12 mm test threshold (`intake-trench.log`).
- Browser intake checks passed (`intake-browser.log`, `test-results/cybercats/intake-browser.json`): 221 sampled moving/fixed part vertices match their intended transforms through deployment/retraction; all 2,269 part IDs and 1,141,549 triangles remain; local and worker Deploy/Retract/Toggle work; changing the saved maximum lowers smoothly to 60°; return to the viewer preserves geometry. No page errors. Earlier attempts were interrupted by a development reload and a test's redundant Escape key; those attempts are not counted as passes.
- Final shooter/hood/intake browser regression passed (`intake-shooter-browser.log`, `test-results/cybercats/shooter-integration.json`): actual viewer presets raise/lower the intake; original roller geometry spins inward with the simulation phase; hood manual 50°/70° and automatic aiming work on local and worker backends; eight Space-key shots score eight times; the single rendered outlet agrees with physics to less than 0.001 mm. iPad portrait page fit passes. No page errors. The local fixture advances the unchanged simulation clock explicitly; worker checks use normal browser frames.
- Render-to-physics intake pose check passed (`intake-sim-pose.log`): all four rendered intake body transforms exactly match the shared linkage solver for simulation snapshots at 0°, 37°, 74°, and back to 0°.

All listed final checks pass. No unresolved failing software check was left in this stage. Robot-specific limitations below remain; this is not a claim that every mechanism is physically calibrated or that all Phase A work is finished.

Screenshots: `docs/mechanism-review/intake-0.png`, `intake-37.png`, `intake-74.png`, and `intake-stowed-simulation.png`. Original highlighted mechanism review images are retained.

## Shooter, hood and indexer

Ptooey already uses the one confirmed M–U release. Turret yaw and hood elevation transform the physical launch ray and CAD together. The turret-mounted camera follows yaw; the outer shooter plates stay fixed relative to the turret during hood movement. Both shooter roller banks spin. Automatic distance aiming and manual hood controls use configurable placeholder calibration, not claimed robot measurements.

**Updated 2026-10-19:** The earlier missing-rotor conclusion below this stage was incorrect. New team confirmation of Revolute 2 and the six-bolt hub/plate connection identify the original V2 cylindrical guide as the rotor carrier. Part 1327 rotates with that carrier. It is now bound to the 42T shaft; no replacement export is needed for the cylindrical guide. See [indexer rotor status](indexer-rotor-status.md) for membership, verification and remaining internal-roller calibration.

Real stowed stops, actuator/roller speeds, hood angle-distance table, shooter RPM/exit speed, indexer speed, bumper dimensions and drivetrain calibration remain unconfirmed. Existing earlier camera, viewport and 600-second soak results are historical; this session's software-rendered Chromium checks do not establish hardware GPU or iPad Safari performance.

## Launch

From PowerShell:

```powershell
cd 'C:\path\to\frc-simulator'
pnpm dev --host 127.0.0.1 --port 5187
```

Open http://127.0.0.1:5187/. Dependencies are already installed. Use `pnpm install` first only for a fresh checkout.
