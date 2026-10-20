# Attribution and source provenance

This project adapts **Chuck Norris: 3D Robot Showcase**, by GitHub user **jcorrea510**, originally created for **FRC Team 3950 RoboGym Robotics**.

- Original repository: https://github.com/jcorrea510/chuck-norris-viewer
- Original website: https://jcorrea510.github.io/chuck-norris-viewer/
- Imported revision: f6829a1baaeb6b8623d42dbdd39eb347509337ba
- The original package.json declares the software license as ISC. Its declaration and source provenance are retained. The upstream repository did not supply a separate project copyright/license notice at the imported revision. No copyright holder or date has been invented here.
- `upstream-provenance.json` records each downloaded source/field file and its upstream Git blob ID.

The user's supplied CyberCats robot geometry replaces the original robot. Original Chuck Norris model GLBs, icons and overnight media were excluded because their asset permission scope is unclear. They are not included as a fallback. Team names in attribution do not imply endorsement.

The field, HUB and FUEL assets originate from AdvantageScope / Littleton Robotics (FRC 6328), under BSD-3-Clause. Their complete copyright, license conditions and disclaimer remain in `public/field/LICENSE-AdvantageScope.txt` and are distributed with the website. Do not remove that file.

Physics: Rapier (Dimforge), Apache-2.0. UI icons: Lucide, ISC. Other runtime/build dependencies retain their package license notices in node_modules; production notices are generated separately for distribution.

CyberCats-specific changes: explicit CAD coordinate normalization, original CAD material preservation, robot profile, asset-path integration and related validation. The original UI, camera/selection behavior, field engine and gameplay source remain the basis of this application.
