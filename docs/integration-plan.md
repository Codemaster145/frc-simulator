# CyberCats CAD integration implementation plan

Goal: adapt the pinned Chuck Norris source directly for the user's CyberCats CAD, retaining the original viewer, Rapier simulation and gameplay. No previous simulator application code is reused.

Architecture: keep the upstream UI/viewer and physics modules. A shared robot profile supplies asset paths, explicit CAD normalization and supported mechanism mappings. Keep visual geometry and measured CAD metadata separate from unconfirmed gameplay constants. Preserve the original source provenance and field license; exclude the original model, icons and media. Original CAD remains read-only outside the project.

Authority: user's Stage 2 brief and explicit Option 1 approval on 2026-10-17. Proceed with original ISC-declared source and user's CAD; no original robot asset fallback. Temporary demo physics is approved. Front, chassis, CAD mass and COM are confirmed; joint details remain pending. No publishing requested.

Execution: implement inline, with test-first changes to normalization/material handling and meaningful integration checks. Isolate in this dedicated project directory because the parent has only untracked earlier simulator files and no Git commit to base a worktree on. Do not stage or commit the parent's unrelated files.

## Tasks and ledger

- [x] Import 72 upstream files at f6829a1baaeb6b8623d42dbdd39eb347509337ba, excluding public/models, public/icons and overnight/media; record provenance.
- [x] Install dependencies, run upstream physics tests and build; record baseline failures rather than conceal them.
- [x] Add attribution and robot profile; test explicit Z-up/yaw transform, ground placement and source-color preservation. Use exact CAD geometry, never the extended model envelope for bumper dimensions.
- [x] Adapt the existing optimizer for explicit source path/profile and geometry-preserving CAD colors. Produce selectable parts, subsystem groups and runtime geometry. Unknown joint configurations remain explicitly pending.
- [x] Connect original viewer and simulator asset paths to the shared profile. Remove silent generic stand-in fallback. Preserve selection, isolation, explode, pit, camera and mobile flows.
- [x] Integrate confirmed mechanics and physics. If user permits, keep upstream calculations as clearly labeled uncalibrated demo physics while real parameters remain missing; otherwise do not activate guessed physics.
- [x] Run build, upstream physics/soak tests and browser interaction tests. Adapt original robot-specific test expectations only when justified by the actual CAD; retain gameplay assertions. Verify driving, collection, launch, score, modes and cameras with evidence.
- [x] Review changes; report actual working features and every missing input or test limitation.

## Review focus

1. Wrong scale or handedness: transform test and output bounds must preserve distances and orientation.
2. Loss of part identity/material appearance during batching: part-ID coverage and material-color tests plus browser selection.
3. Original robot assumptions leaking into CyberCats mechanisms: configure only verified moving groups and show pending status.
4. Unapproved physics passed off as measurements: separate provenance and labels; extended envelope never feeds bumpers.
5. Failed model loads silently showing a generic robot: fail visibly and keep Simulate unavailable until actual CAD loads.

## Baseline notes

- npm executable is unavailable; bundled pnpm is available. Import original package-lock into pnpm lock and preserve original lockfile.
- No original model GLBs or third-party robot media were downloaded into the new project.
- CAD audit lives in the parent docs/cad-analysis directory; source SHA-256 is 16f99acca5a84d074d8e3052af39287a139d8c0ce01bbb4e608bfd0ed713487d.

## Continued-session verification

- Metadata failure now aborts CAD loading before part-state allocation (HTTP and malformed-JSON regressions failed first, now pass).
- Severe FUEL floor penetration during active contact is now handled by the existing floor-recovery path. Direct regression failed first; 600-second unchanged soak passes.
- Latest `phase-a-physics.log`: 27/27; `phase-a-cad.log`: 5/5; `phase-a-build.log`: success; `phase-a-soak.log`: 600-second pass.
- Viewer, presentation, transparency, part controls, focused integration and load-failure checks pass. Final retained upstream gameplay suite: 44/44 checks pass, including all four worker viewport sizes (`phase-a-upstream-final.log`). Original-source hierarchy comparison and isolated WASD/Q/E browser checks also pass.
- Phase A implementation and available verification are complete within the approved demo-physics scope. Actual joint animation/calibration and physical hardware performance remain pending; see integration-status.md.
- Fresh reviewer verified the frame conversion and identified the metadata fallback. Its final written verdict was interrupted by account usage limits; that finding was fixed and regression-tested. No additional agent was started.
