# CyberCats mechanism correction

## Resume status — 2026-10-19

The original plan below is historical. Shooter/turret/hood work is implemented and verified; Arthritis deployment is complete and the current stage binds the confirmed V2 Dye Rotor carrier. See [intake deployment status](intake-deployment-status.md) for current evidence and remaining calibration.

- Actual intake upper Driver arms and cycloidal output flanges rotate about A. Lower links rotate about B. Coupler motion closes the measured four-bar; rear supports follow the measured F bearing and E sliding pin. Original deployed pose is 0°. Estimated stow is 74°.
- Deploy/Retract/Toggle, smooth simulation motion, original roller animation, persisted adjustable maximum (0–74°), local/worker commands and the existing viewer mechanism controls are connected.
- Replaced the inherited intake field-contact box with a convex envelope generated from the actual Coupler vertices. Kept approved demo FUEL forces and indexer transport.
- Complete original-part triangle sweep at 0.5° steps: no NEW intersections after fixing gear 754's moving membership. Existing foam/support overlap is retained. Additional intake/turret/hood combined sampling also passes.
- Updated indexer finding: the V2 cylindrical guide is present. Team confirmation of Revolute 2 plus the bolted 42T/SplineXL stack identify part 1327 and its fastened guide structure as rotating. Implemented original carrier membership, preserving external motor and stationary bearing mounts. See [indexer rotor status](indexer-rotor-status.md). Internal roller relative spin and real mechanism calibration remain pending. No Phase B work.

Continue the existing Phase A implementation. The user's 2026-10-18 request is the specification. Preserve the original simulation engine and scoring; change CAD bindings and shooter geometry at their source.

Findings: two upstream turret/spawn definitions are hard-coded; no CyberCats moving groups are configured. The retained per-vertex IDs permit separating moving and stationary triangles without a new CAD export. The broad “Turret” name matcher incorrectly captures MK4 Line Turret swerve assemblies. CAD collision geometry is not imported: colliders remain the explicitly labeled demo chassis/bumper/feed shapes, so electronics meshes must remain excluded.

1. Correct classification and separate meshes by part identity into nested pivot/offset groups. Preserve every original triangle, material and ID. Keep classification independent from motion, including turret-mounted electronics.
2. Confirm the Ptooey outlet/flow direction and uncertain rotating membership using annotated CAD views. User has authorized temporary configurable turret limits; this does not establish physical outlet direction or missing rotor membership.
3. Bind confirmed turret, shooter wheels and indexer groups to the existing viewer controls and physics snapshots. Centralize geometry so launch origins, directions, visual motion and debugging use the same transforms. Remove old dual launch points once the actual outlet arrangement is established.
4. Verify stationary supports, electronics placement, part selection/explode, spawn alignment through rotation, real firing/scoring/worker behavior and retained drive modes. Run meaningful focused regressions, build, physics and browser checks after relevant changes.

Review focus: nested wheel/turret transforms; subgroup crossings for moving cameras; part bounds after partition; chassis-to-CAD frame rotation; unconfirmed geometry being represented as measured. Each receives a focused check. Pending team questions are separate from routine implementation choices.
