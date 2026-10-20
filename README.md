# CyberCats Robot Simulator — FRC 2872

The original Chuck Norris viewer and Rapier simulator, adapted directly for the Wheatley CyberCats CAD. See [ATTRIBUTION.md](ATTRIBUTION.md). No original robot model, imagery or generic fallback is distributed. No Phase B redesign has been started.

GitHub Pages: https://codemaster145.github.io/frc-simulator/ (published from `main` by `.github/workflows/deploy.yml`).

## Run locally

Use Node.js and pnpm from this directory:

```powershell
pnpm install --frozen-lockfile
pnpm dev --host 127.0.0.1 --port 5187
```

Open http://127.0.0.1:5187/ and choose **Simulate**. WASD drive, Q/E turn, Space shoot, F intake, R arm, V camera. Touch controls and gamepad mappings remain available. **High Score** runs a 60-second round. Settings has Controls Help.

## Configured

- Actual CyberCats geometry: 2,269 selectable bodies, 76 source material definitions, approximately 1.14 million optimized triangles / 13.93 MB. Original 674 MB GLB is untouched. A 0.3 mm simplification target produces display geometry, not manufacturing geometry.
- Separate **Arthritis — Intake**, **a thunk a thunk — Dye Rotor / Indexer**, and **Ptooey — Shooter**, plus drivetrain/electronics/frame.
- Confirmed forward points **opposite the intake**. Source Z-up becomes runtime Y-up; canonical CAD +Z is forward. Both modes use the same model. The original simulator retains its intake-facing internal body frame; visual CAD and COM receive the same 180-degree frame conversion in Simulate, restored on exit.
- Confirmed chassis: 27.5 × 27.5 in (0.6985 m square), separate from bumpers and extended mechanisms.
- Approximate CAD mass: 124.3 lb (56.3815 kg), not a weighed completed robot. Canonical CAD COM: (+0.002979, +0.178105, −0.091269) m. In the inherited simulator body frame: (−0.002979, +0.178105, +0.091269) m.
- Original selection, search, hide/isolate, explode, camera, settings and motion-control infrastructure remain. The perimeter **Foam** part supports red/blue switching without recoloring other parts.

## Temporary demo physics and remaining calibration

Simulate explicitly displays **Uncalibrated demo physics**. Approved upstream drivetrain, inertia, suspension, bumper/hull, intake/indexer and shooter calculations remain. They are not CyberCats measurements. Ptooey uses the measured single outlet between the main and upper wheels; exact motor/gearing/tire parameters and shooting performance are not calibrated. Bumper collision dimensions remain upstream demo values; extended CAD dimensions are never used as bumpers.

The intake follows the measured four-bar geometry from deployed 0° to an estimated 74° stow. Every new Simulate session shows it raised on the first frame, then lowers it over 0.5 seconds. The V2 indexer guide and chain-driven carrier rotate with the confirmed 12T:42T relationship; internal relative roller spin remains unconfigured. The turret and attached camera rotate, and the hood pivots independently. Movement limits and speeds still need team calibration. See [annotated CAD review](docs/cad-review/index.html).

## Verification

```powershell
pnpm run test:cad
pnpm run test:phys
pnpm run build
pnpm run soak
$env:CYBERCATS_SOFTWARE_GPU='1' # for headless software-rendered checks
pnpm run e2e
```

Browser checks serve the production build automatically. Set `CYBERCATS_TEST_URL` only for an existing server. To test the exact GitHub Pages subpath independently, run `node scripts/preview-pages.mjs` after building and open http://127.0.0.1:5198/frc-simulator/. `scripts/verify.mjs --sim-only` retains upstream gameplay checks; original CAD checks refer to the old robot and are kept for provenance. See [integration status](docs/integration-status.md) for verified results and remaining calibration/performance limits.

Compare the original source hierarchy with the selectable viewer hierarchy without rebuilding:

```powershell
node scripts/check-cad-hierarchy.mjs 'C:\path\to\Robot Assembly.glb'
```

Rebuild the display model:

```powershell
$env:CYBERCATS_CAD='C:\path\to\Robot Assembly.glb'
pnpm run model
```

The active dependency lock is `pnpm-lock.yaml`. Original npm lock and README: `docs/upstream/`. Distributed credits: `public/attribution.html` and `public/THIRD-PARTY-NOTICES.txt`.
