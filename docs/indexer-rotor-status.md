# V2 Dye Rotor — 2026-10-19

**Found in the existing GLB and animated. No replacement rotor export is needed.** The prior conclusion that a separate paddle/rotor was missing was incorrect. The team confirmed the large cylindrical guide rotates on Onshape `Revolute 2`; its mounting geometry identifies the connection to the existing 42T/SplineXL drive.

## Geometry and binding

- Retained V2 hierarchy: metadata node 1433, under `a thunk a thunk`. The optimized export contains 278 selectable parts here, including 107 individually expanded chain links; that count is not directly comparable to the Onshape UI's 148 instances.
- Original guide parts: 1225 Upright Tube, 1230 Rear Closeout, 1268 Part 81, 1320 Hook Closeout, 1325 Up Feed Ramp, 1327 Dye Lower Pinion Support Plate, 1328 Dye Upper Plate, 1352 Dye Lower plate.
- Six screws 1338/1339/1341/1343/1345/1346 pass through the central stack and plate 1327, meeting nuts 1243/1291/1329/1348/1353/1502. The stack contains the 42T sprocket 1337 and SplineXL tube 1342. Matching peripheral holes and bolts 1264/1292/1359 connect 1327 to lower plate 1352; perimeter standoffs and screws carry the upper plate, guides and roller supports.
- 106 carrier parts plus the existing 11-part central stack rotate. The entire V2 assembly is **not** rotated. External motor 1476, motor mount 1480, idler mount 1307, stationary bearing mounts and the surrounding Flopper structure remain fixed. Bearings mounted in the rotating carrier travel with it; stationary central bearings 1505/1540 and retention cap 1527 remain fixed.
- Canonical axis: +Y through `[0.006349999825, 0.084623778821, 0]` metres, measured from the coaxial 42T/SplineXL stack. Axis height is arbitrary along this vertical line. The chain gives a 12:42 angular reduction: 3.5 revolutions of the 12T output drive produce one carrier revolution. This is the sprocket ratio, not a claim about motor RPM or gearbox calibration. The direction setting below determines the commanded sign.
- Exact carrier IDs: `src/indexer-rotor.json`. Named part IDs, hierarchy nodes and original rest bounds: `test-results/cybercats/indexer-rotor-membership.json`. No GLB geometry, scale, material or rest position was replaced.

**Direction correction — 2026-10-19:** The team reported the initial animation ran backward. `src/indexer-direction.json` now sets `reverseIndexerDirection: true`. This negates the shared CAD drive angle before it reaches the 12T shaft, idlers, chain links and 42T carrier. Axis, pivot, geometry and the magnitude of the 12:42 reduction are unchanged. A positive simulated or manual input phase now yields `−inputAngle` at the motor CAD and `−inputAngle × 12/42` at the carrier. The existing FUEL transport remains unchanged because its observed intake-to-shooter flow was already correct.

The GLB has geometry/instance metadata but no Onshape mate constraints. No document link was available to inspect `Revolute 2` directly. The rotational freedom comes from the team's confirmation; the axis and fastened membership come from the CAD stack and matching fasteners. The internal vertical and horizontal roller banks are present. They travel with their carrier, but independent roller, belt and pinion motion relative to the carrier is not enabled. The stationary Planetary Sun (1512) and carrier pinion (1227) are visible; their complete relative drive still needs verification rather than an invented speed.

## Gameplay and verification

The existing physics indexer phase drives the CAD through `dye-drive` → `dye-driven`. Original chain links and output sprockets remain animated. The approved demo floor forces and feed lane still transport actual simulation FUEL to the existing Ptooey outlet and scoring system. This is not a new triangle-contact model of FUEL squeezing through the rotating guide.

- **13 focused tests passed:** CAD classification, original geometry/rest-pose preservation, four quarter-turn rotor transforms and 12:42 ratio, chain path, intake deployment/collection, single-outlet shooter/hood, full intake-to-HUB pipeline and sampled rotor clearance. Log: `indexer-focused-tests.log`.
- **Build passed:** TypeScript, Vite and PWA (`indexer-build.log`).
- **Browser passed:** guide/fastener transforms at 0/90/180/270/360 degrees, fixed external supports, and one floor FUEL ball collected → indexer lane → launched → scored. Rendered rotor follows the live physics phase with zero measured quaternion error (`indexer-rotor-browser.log`, `test-results/cybercats/indexer-rotor-browser.json`).
- **Worker browser passed:** default WorkerBackend advances the indexer and rendered guide follows the same snapshot exactly (`indexer-worker-browser.log`).
- **After the direction correction:** the focused browser test checks reversed manual steps at 90° carrier intervals, the motor sprocket and chain path, continuous rotor animation while feeding, and intake → indexer → HUB scoring (`indexer-reverse-browser.log`). Build and focused regression results are in `indexer-reverse-build.log` and `indexer-reverse-tests.log`; the default worker check is in `indexer-reverse-worker.log`.
- **Clearance scope:** original triangle surfaces sampled every 15 degrees with other mechanisms at the exported deployed pose. No new intersections. Existing contacts and intentional moving-chain/tooth engagement are excluded. This does not certify continuous clearance or all combined mechanism poses.
- The first new rig regression failed before the fix, as intended: part 1225 had no rotor binding. An initial clearance fixture incorrectly froze the moving chain, reporting sprocket/link contact; the corrected fixture explicitly excludes that intentional engagement. Two initial worker test attempts exposed harness timing mistakes (reading before backend initialization, then comparing different snapshots across an async import); those fixture errors were corrected. No product changes were needed for those attempts. Final checks above pass.

These browser checks use software-rendered Chromium. They establish functionality, not laptop GPU or iPad Safari performance. Existing intake, turret, hood, shooter and scoring implementations were preserved. Independent internal roller spin, physical RPM/feed calibration and contact mechanics remain incomplete; no claim of fully calibrated Phase A completion is made.

## Review images

- [Original guide and hub stack](mechanism-review/v2-hub-fasteners.png)
- [Rotor at rest](mechanism-review/v2-rotor-rest.png)
- [Rotor at a quarter turn](mechanism-review/v2-rotor-quarter-turn.png)
- [Actual robot after the browser scoring check](mechanism-review/v2-rotor-simulation.png)

Earlier highlighted CAD review images remain unchanged as historical investigation evidence. Their former missing-rotor/stationary-plate captions are superseded by this finding.

Run locally with `pnpm dev --host 127.0.0.1 --port 5187` from the existing project, then open http://127.0.0.1:5187/.
