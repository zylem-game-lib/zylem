# Zylem frame press

An Anatomy **Figure**: a six-station press carries one workpiece through a game update; a separate inspection bed samples the latest completed scene on its own clock. The press describes execution order, not CPU cost. Pausing updates parks the press at an update boundary while the inspection shutter continues drawing the last scene.

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

Open `/zylem/machine`. The generator also writes the self-contained `website/static/anatomy/frame-machine/index.html`; open it directly without a web server. The directory URL works with Docusaurus's clean URLs and the `/zylem/` deployment prefix. Website start/build regenerate it. Generated HTML is ignored; source, model, styles and the pinned kit are committed. No Anatomy package or engine dependency is added to game-lib.

`model.ts` is shared by Node tests and the browser through Node's TypeScript stripping. `geometry.mjs` creates the static SVG once. `spatial.ts` sorts the axis-aligned solids by separating planes as the carriage moves; only transforms and changed DOM order are updated. Tests replay an entire cycle, checking collisions and ordering, and check the execution order against source to flag drift.

Controls: Space pauses the illustration, Right/N completes one station, R resets, the station buttons inspect a station, and Pause game updates finishes the current update then holds the press. In reduced motion there is no automatic animation; Step and Draw once remain available. Animation also stops offscreen and in hidden tabs. Hover/focus holds the idle tour; explicit Play runs until paused or hidden.

## Validation

- Seven Node tests pass, including clock independence, source-order drift and 720 geometry poses.
- The machine TypeScript check passes. Library bundles/declarations, API extraction, schemas, documentation generation, snippet checks and the Docusaurus production build pass (existing API documentation warnings remain).
- Chromium checks cover play/pause, stepping, direct inspection, independent drawing, reset, keyboard, reduced motion, desktop/mobile layout, zoom and the production page's iframe sizing.
- Anatomy’s line check reports zero floating line ends in all six inspection poses in both themes. Desktop, 390px and 4× detail captures were reviewed.
- Existing repository-wide checks have separate baseline issues: Biome 2 cannot read the Biome 1 configuration; the website TypeScript config uses `baseUrl`, removed by the installed TypeScript 7 command, and React declarations are missing. These settings were not changed for the machine.

## Attribution

Built using [Ryan's Anatomy skill](https://skills.wheresryan.sh/anatomy#install). `vendor/iso-kit.mjs` is unmodified from [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy), commit `1482e8469b0a9e0d8cc18ea2740a01423d29ae80`. Its MIT notice is in `vendor/LICENSE` and included in the generated page. The skill itself is not a runtime dependency or a global installation.
