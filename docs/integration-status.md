# CyberCats Stage 2 integration status — 2026-10-17

**Historical baseline:** the mechanism-pending and dual-shooter statements below have been superseded by the [2026-10-19 mechanism status](intake-deployment-status.md). Keep this record for its earlier viewer, controls, viewport and soak evidence.

Continued the existing pinned upstream integration. No rebuild of the simulator and no Phase B work. The original user's GLB is unchanged. Original robot assets are omitted. Source and dependency/field notices are included.

## Confirmed configuration

The latest team confirmation reverses the initial proposed forward: canonical CAD +Z points opposite Arthritis. The optimizer now uses yaw 155.56805667945237 degrees, with source Z becoming runtime Y. Canonical COM is (+0.002979,+0.178105,−0.091269) m, mass ~56.3815 kg, chassis 0.6985 m square. The simulator's inherited intake-facing body frame is retained; BOTH visual CAD and canonical COM receive a 180-degree rotation into it. Thus the demo intake stays on the rear-intake side without inventing a new mechanism. The canonical orientation is restored on exit.

Mechanism identities are team confirmed: Arthritis=Intake; a thunk a thunk=Dye Rotor/Indexer; Ptooey=Shooter. Their exact moving groups, axes, pivots and travel limits remain unknown; no fabricated animations are enabled. Updated annotated views: [CAD review](cad-review/index.html).

## Evidence

- Baseline upstream physics: 21/21 passed before changes (`baseline-physics.log`).
- Latest automated suite: 27/27 passed (`phase-a-physics.log`), including acceleration, bump/trench traversal, solid field collision, intake/indexer/shooting calculations, scoring, moving shots, determinism, a 60-second AI run, COM/frame conversion, and CAD-load failure regressions.
- CAD transform/material tests: 5/5 passed (`phase-a-cad.log`). Production build passes (`phase-a-build.log`), including TypeScript and PWA generation.
- Actual CAD retained: 2,269 body IDs, 76 material definitions, 164 meshes, 1,141,549 triangles, 13.93 MB. Original source: 674,492,304 bytes. Source SHA256: `16f99acca5a84d074d8e3052af39287a139d8c0ce01bbb4e608bfd0ed713487d`.
- Viewer and detail browser checks passed: loading actual CAD, orbit/zoom, all six subsystem selections, search/part inspection, explode/collapse, explicit pending mechanisms, mobile page fit, isolate/hide/show-all and presentation mode. Actual Foam bumper switches blue and restores source red without recoloring other parts (`phase-a-browser.log`, `test-results/cybercats/viewer-results.json`, `details-results.json`).
- Focused gameplay browser checks passed: original W key drives field-forward with confirmed CAD front aligned; floor FUEL collection; actual CAD/approved mass/transformed COM in Rapier; real worker simulation; mobile page fit; clean return to canonical viewer orientation (`phase-a-gameplay.log`). A preceding test fixture put the robot against the TOWER and failed its heading assertion; moving the fixture to clear carpet resolved it without a production change. Thus the earlier combined `phase-a-browser.log` command is not itself an all-green run.
- Model 404, metadata 404 and malformed metadata each produce a visible load failure and prevent simulation/readiness (`phase-a-load-errors.log`).
- The retained upstream gameplay suite passes against the final build (`phase-a-upstream-final.log`): Free Drive/AI takeover, touch driving, eight shots, indexer stop, intake controls, ferry, camera transitions/cycling, alliance settings, High Score countdown/60-second round/results/personal-best persistence, paused stability in all three camera modes, randomized input, exit/reload and settings persistence. Real worker physics, non-overlapping controls and no console errors pass at iPad Air landscape/portrait, iPad Pro landscape and laptop viewport sizes. These are emulated viewports in Chromium, not physical Apple-device tests.
- Original GLB hierarchy comparison passes (`phase-a-hierarchy.log`): 4,851 source nodes contain 2,269 mesh instances. All 2,269 selectable IDs and every assembly/part parent relationship match the 2,582-node viewer metadata, after collapsing 2,269 redundant occurrence wrappers and renaming the display root. Render meshes are batched; the assembly hierarchy is retained in metadata.
- Focused direction checks pass (`phase-a-directions.log`): W/A/S/D each move in the expected field direction; Q/E rotate oppositely and the real CAD follows the body. Intake selection activates 580 focused parts and 164 transparent ghost meshes. No page errors.

The final applicable checks above have no remaining failing assertions. Earlier failed runs are retained for traceability, not counted as passes. The original-robot-only viewer assertions are inapplicable to CyberCats and are not part of this result. No application code changed after the successful build; subsequent additions are verification scripts and documentation.

## Resolved findings and verification limits

1. The previous 600-second soak exposed a FUEL floor-penetration event under active contact. Extended the existing floor recovery to handle severe penetration; a direct failing regression now passes. The unchanged 600-second soak now passes (`phase-a-soak.log`), with no relaxed invariant threshold.
2. A previous paused driver-view screenshot changed pixels around the Intake button. The current sequential browser run passed all three camera comparisons; the earlier transient's cause was not established. Browser checks use Chromium software rendering at battery quality and are very slow (roughly 0.6–0.9 FPS in this environment). This is not a hardware GPU/iPad Safari performance certification.
3. Missing/malformed part metadata formerly fell back to an invalid empty selection texture. Loading now fails visibly before setup. HTTP/parse regressions and real browser fault injection pass.

## Remaining robot-specific work

- Team confirmation of highlighted moving part membership, shafts, pivots and limits; then enable corresponding existing mechanism controls and CAD animation.
- Actual bumper dimensions, wheelbase/track, motors, gearing, tire diameter, inertia, ready-to-play weighed mass, intake/indexer speeds and shooter exit/angle/RPM settings.
- Replace the approved upstream dual-shooter and intake/feed proxy geometry with calibrated Ptooey/Arthritis/Indexer behavior. Current shots/feed paths and capacity remain demo parameters even though actual CAD is displayed and correct mass/COM are applied.
- Verify real GPU performance and target iPad/Safari/offline operation. No deployment has been performed.

## Implementation rulings

- Used a dedicated nested directory instead of a worktree: parent has unrelated untracked work and no base commit. Parent application was not reused.
- Preserved the upstream internal body frame and converted both model and COM into it; this retains the authorized original physics and keeps the intake on the correct side.
- Replaced an upstream origin-based contact velocity calculation with COM-based rigid-body velocity. A failing COM regression test reproduced the error before the fix; the original physics suite then passed.
- Unknown joint animation stays disabled. Preserving the controls' infrastructure does not justify inventing limits.
- Original robot-specific viewer tests remain available for provenance; CyberCats viewer checks replace their inapplicable twin-turret/brain-pan assertions. Gameplay assertions remain.
