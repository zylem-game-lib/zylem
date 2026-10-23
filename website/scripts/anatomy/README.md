# Zylem machines

The gallery at `/zylem/machine` contains five Anatomy **Figures**. Choose Game, Config, Stage, Entity, or Frame press in the navigation. Each has a shareable URL hash (`#game`, `#config`, `#stage`, `#entity`, `#frame`).

## Frame press

The original figure is a six-station press carries one workpiece through a game update; a separate inspection bed samples the latest completed scene on its own clock. The press describes execution order, not CPU cost. Pausing updates parks the press at an update boundary while the inspection shutter continues drawing the last scene.

## Source of truth

Read against Zylem `d43002a97b55f723bb4ab047088c65b2bd7862cb`:

- `packages/game-lib/src/lib/game/zylem-game.ts`: `params`, `step`, `loop`.
- `packages/game-lib/src/lib/stage/zylem-stage.ts`: `_update`, render-loop setup in `load`.
- `packages/game-lib/src/lib/camera/renderer-manager.ts`: `startRenderLoop`.
- `packages/game-lib/src/lib/collision/world.ts`: simulation ownership and update.

The old architecture/frame-update diagram differs from this implementation. This figure follows the implementation. The running-stage path is grouped into six stations; loading, disposal, stage changes, editor overlays and individual behavior internals are outside its scope. The display is a pedagogical latest-completed-scene latch, not an extra buffer or thread added to Zylem. Actual JavaScript callbacks execute serially; rendering cannot interrupt a synchronous stage update. All animation cadences and counters belong to the illustration, not a benchmark or runtime instrumentation.

## Mechanism and parts plan

World axes: x along the transport, y across the bed, z up. One isometric camera, 30° elevation. Rectangular slides avoid hidden shafts through solid guide blocks. Each press shoe touches the workpiece only while the carriage is parked. Shoes retract before transport. The carriage returns along the same clear rails.

- Base: 4 rubber feet, 4 foot pads, 1 beveled bed, inset perimeter groove, 4 screw seats.
- Structure: 2 rails, 2 end stops, 1 ruler strip, 6 upright columns, 6 cantilever arms.
- Mechanism: 6 rear slide guides, 12 guide cheeks, 6 sliding rams, 6 shoes, 1 carriage, 2 carriage runners, 1 workpiece.
- Output: 2 support blocks, 1 inspection bed, 4 aperture edges, 1 scene plate, 1 sliding shutter.
- Controls: 1 switch base, 1 switch slot, 1 switch handle. The adjacent HTML buttons operate the same model.
- Details: closed screw rings and slots, edge-rooted ruler ticks, grooves and the one engraved ZYLEM plate. The workpiece is the single lit subject.

## Build and check

From the repository root (Node >=22.22.2):

```sh
pnpm --filter @zylem/website anatomy:build
pnpm --filter @zylem/website anatomy:test
pnpm --filter @zylem/website anatomy:typecheck
pnpm docs:dev
```

Open `/zylem/machine#frame` for the frame press. The generator also writes the self-contained `website/static/anatomy/frame-machine/index.html`; open it directly without a web server. The directory URL works with Docusaurus's clean URLs and the `/zylem/` deployment prefix. Website start/build regenerate it. Generated HTML is ignored; source, model, styles and the pinned kit are committed. No Anatomy package or engine dependency is added to game-lib.

`model.ts` is shared by Node tests and the browser through Node's TypeScript stripping. `geometry.mjs` creates the static SVG once. `spatial.ts` sorts the axis-aligned solids by separating planes as the carriage moves; only transforms and changed DOM order are updated. Tests replay an entire cycle, checking collisions and ordering, and check the execution order against source to flag drift.

Controls: Space pauses the illustration, Right/N completes one station, R resets, the station buttons inspect a station, and Pause game updates finishes the current update then holds the press. In reduced motion there is no automatic animation; Step and Draw once remain available. Animation also stops offscreen and in hidden tabs. Hover/focus holds the idle tour; explicit Play runs until paused or hidden.

## Validation

- Twelve Node tests pass, including clock independence, source-order drift and 720 geometry poses.
- The machine TypeScript check passes. Library bundles/declarations, API extraction, schemas, documentation generation, snippet checks and the Docusaurus production build pass (existing API documentation warnings remain).
- Chromium checks cover play/pause, stepping, direct inspection, independent drawing, reset, keyboard, reduced motion, desktop/mobile layout, zoom and the production page's iframe sizing.
- Anatomy’s line check reports zero floating line ends in all six inspection poses in both themes. Desktop, 390px and 4× detail captures were reviewed.
- Existing repository-wide checks have separate baseline issues: Biome 2 cannot read the Biome 1 configuration; the website TypeScript config uses `baseUrl`, removed by the installed TypeScript 7 command, and React declarations are missing. These settings were not changed for the machine.

## Attribution

Built using [Ryan's Anatomy skill](https://skills.wheresryan.sh/anatomy#install). `vendor/iso-kit.mjs` is unmodified from [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy), commit `1482e8469b0a9e0d8cc18ea2740a01423d29ae80`. Its MIT notice is in `vendor/LICENSE` and included in the generated page. The skill itself is not a runtime dependency or a global installation.

## Game, Config, Stage, and Entity

`catalog.ts` contains captions and source paths, pinned to the same engine revision as the frame press. Additional sources under `packages/game-lib/src/lib/`: `game/game.ts`, `game/game-config.ts`, `stage/stage-config.ts`, `entities/create.ts`, `entities/entity.ts`, `entities/actor.ts`, `entities/sprite.ts`, `entities/text.ts`, `entities/zone.ts`, `level/stream-level.ts`, and `level/stream-level-stage.ts`.

Concept and parts plan (x across the bench, y toward the reader, z up):

- **Game / stage switchboard (54 solids):** five socketed modules for authoring, input, shared renderer, current stage, and updates. Four feet and pads, grooved base, five sockets/cases/vented lids, ten terminals, five switch seats and handles, two rails, two stops, two shoes, selector carriage and index, ruler, nameplate. A selector slides to the responsibility being inspected; these are not sequential frame phases.
- **Config / defaults cabinet (74 solids):** four supported drawers for game defaults, explicit desktop resolution, mobile resolution, and stage options. Four feet and pads, base, four posts, four top frame bars, eight crossbars, eight full-length runners; each drawer has a floor, four walls, two handle mounts, pull, config card, indicator. The selected handle is the single accent. Drawer floors remain supported throughout the 55-unit travel.
- **Stage / scene workbench (63 solids):** five trays carry a camera assembly, a scene specimen, a simulation stack, entity blocks, and an empty cleanup tray. Each sits on four standoffs. The common rail carriage points to the inspected resource. Cleanup is a lifecycle responsibility, not a per-frame operation.
- **Entity / assembly jig (74 solids):** six trays hold a model figurine, a four-cell spritesheet, primitive solids, typesetting bars, a sensor frame, and five level entries. Four standoffs per tray; the inspector runs in front. Actor, Sprite, Shapes, Text, and Zone are entity paths. Level is explicitly a batched catalog-to-stage stream, not an entity subclass.

`gallery-geometry.mjs` builds static assemblies once. `gallery-spatial.ts` poses drawers and inspectors; separating planes determine painter order throughout motion. `gallery-live.ts` applies eased translations and changes DOM order only when necessary. There are no new runtime dependencies.

The existing Anatomy build calls `gallery-build.mjs`, generating `website/static/anatomy/{game,config,stage,entity}-machine/index.html`. These ignored outputs also open directly as standalone files. The docs page loads only the selected machine and retains automatic iframe sizing and deployment-prefix support.

Controls: select a part, Previous/Next, Play/Pause tour, Reset, Zoom, and theme switch. With the drawing focused, Left/Right step, Home/End select endpoints, Space toggles the tour, and R resets. Selecting a part stops the tour. Hover/focus holds the idle tour; explicitly playing resumes it. Offscreen/hidden documents stop animation. Reduced motion disables automatic tours while discrete inspection stays available. Accessible status messages change on explicit selection, not every animation frame.

Gallery verification:

- Every source link resolves locally. Tests sample all ordered selection pairs at 21 points (2,142 poses), checking every pair of solids for intersection and every assembly for acyclic painter order.
- Browser checks cover all 20 resting selections in both themes, keyboard wrapping, reset, zoom, reduced motion, and 390px layout. Anatomy line checks report zero floating ends in all 40 poses.
- The desktop/default/mobile/native examples were checked against the actual bundled `resolveGameConfig`, including the 640 × 360 mobile fallback.
- Production navigation, deep links, history, iframe sizing, animated tours, and source links are checked alongside desktop, mobile, and 4× visual review.
