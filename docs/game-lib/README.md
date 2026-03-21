# `@zylem/game-lib` docs

This directory is the documentation home for the `packages/game-lib` package.

The goal is to keep the docs tree easy to navigate by **mirroring the source layout** and storing **diagrams** (mostly PlantUML `.puml`; the package overview is Mermaid `src/overview.mmd`) next to the subsystem they describe.

## How this docs tree is organized

- Source package: `packages/game-lib`
- Source code root: `packages/game-lib/src`
- Docs root: `docs/game-lib`
- Mirrored docs root: `docs/game-lib/src`

### Mapping rule

For any source area:

- source: `packages/game-lib/src/<area>`
- docs: `docs/game-lib/src/<area>`

Examples:

- `packages/game-lib/src/api` -> `docs/game-lib/src/api`
- `packages/game-lib/src/lib/game` -> `docs/game-lib/src/lib/game`
- `packages/game-lib/src/lib/physics` -> `docs/game-lib/src/lib/physics`
- `packages/game-lib/src/web-components` -> `docs/game-lib/src/web-components`

## What these diagrams should cover

The package naturally breaks down into these documentation areas:

- **Core runtime**
- **Stage / scene orchestration**
- **Entities and composition**
- **Behaviors and gameplay systems**
- **Actions and transform pipeline**
- **Camera and rendering**
- **Physics and collision**
- **Input**
- **Assets / loaders**
- **Audio helpers**
- **Web component host**
- **Public API surface**

## Diagram map

The table below is the canonical map for where diagrams belong and what each area should explain.

| Area | Source subtree | Docs subtree | Suggested diagram files | Focus |
| --- | --- | --- | --- | --- |
| Overview | `packages/game-lib` | `docs/game-lib/src` | `overview.mmd`, `overview.svg` | End-to-end architecture map across major subsystems |
| Public API | `packages/game-lib/src/api` | `docs/game-lib/src/api` | `public-api-package-diagram.puml` | Public entrypoints, re-export structure, package surface |
| Game runtime | `packages/game-lib/src/lib/game` | `docs/game-lib/src/lib/game` | `game-startup-sequence.puml`, `game-runtime-overview.puml` | `Game`, `ZylemGame`, config resolution, startup flow, loading, loop orchestration |
| Stage runtime | `packages/game-lib/src/lib/stage` | `docs/game-lib/src/lib/stage` | `stage-runtime-class-diagram.puml`, `stage-lifecycle-sequence.puml` | `Stage`, `ZylemStage`, delegates, stage loading and update flow |
| Core | `packages/game-lib/src/lib/core` | `docs/game-lib/src/lib/core` | `base-node-lifecycle-class-diagram.puml`, `core-foundations-overview.puml` | `BaseNode`, `Vessel`, lifecycle contexts, blueprint/foundation concepts |
| Assets / loaders | `packages/game-lib/src/lib/core/loaders` | `docs/game-lib/src/lib/core/loaders` | `asset-loading-subsystem.puml` | `AssetManager`, adapters, cloning, cache flow, loading events |
| Entities | `packages/game-lib/src/lib/entities` | `docs/game-lib/src/lib/entities` | `entity-architecture.puml` | `GameEntity`, builders, concrete entities, composition model |
| Actions | `packages/game-lib/src/lib/actions` | `docs/game-lib/src/lib/actions` | `action-transform-pipeline.puml` | `Action`, `BaseAction`, transform store, buffered movement intent |
| Behaviors | `packages/game-lib/src/lib/behaviors` | `docs/game-lib/src/lib/behaviors` | `behavior-runtime-architecture.puml` | descriptors, behavior refs, systems, FSM-backed behaviors |
| Camera | `packages/game-lib/src/lib/camera` | `docs/game-lib/src/lib/camera` | `camera-subsystem.puml` | `CameraWrapper`, `ZylemCamera`, pipeline, perspectives, manager |
| Graphics | `packages/game-lib/src/lib/graphics` | `docs/game-lib/src/lib/graphics` | `scene-rendering.puml` | scene management, materials, instancing, renderer integration |
| Input | `packages/game-lib/src/lib/input` | `docs/game-lib/src/lib/input` | `input-subsystem.puml` | provider model, merged input state, keyboard/mouse/gamepad mapping |
| Collision | `packages/game-lib/src/lib/collision` | `docs/game-lib/src/lib/collision` | `collision-dispatch-architecture.puml` | collision builder, world attachment, callbacks, delegates |
| Physics | `packages/game-lib/src/lib/physics` | `docs/game-lib/src/lib/physics` | `physics-worker-bridge.puml` | proxy/worker protocol, body handles, transform sync, collision events |
| Systems | `packages/game-lib/src/lib/systems` | `docs/game-lib/src/lib/systems` | `frame-update-sequence.puml` | frame order, world step, behavior updates, transform sync |
| Sounds | `packages/game-lib/src/lib/sounds` | `docs/game-lib/src/lib/sounds` | `audio-utilities-overview.puml` | lightweight sound helpers and audio utility role |
| Web components | `packages/game-lib/src/web-components` | `docs/game-lib/src/web-components` | `zylem-game-runtime.puml` | `<zylem-game>`, DOM hosting, runtime bootstrapping, display/debug wiring |

## Conceptual section coverage

The original high-level sections map onto the repo like this:

| Conceptual section | Concrete package areas |
| --- | --- |
| Core | `src/api`, `src/lib/game`, `src/lib/stage`, `src/lib/core` |
| Scene / Entity system | `src/lib/stage`, `src/lib/entities`, `src/lib/behaviors`, `src/lib/actions`, `src/lib/systems` |
| Rendering | `src/lib/camera`, `src/lib/graphics` |
| Physics | `src/lib/collision`, `src/lib/physics` |
| Input | `src/lib/input` |
| Audio | `src/lib/sounds` |
| Assets / Resources | `src/lib/core/loaders` |
| UI / embedding | `src/web-components` |

### Notes

- Save/load and blueprint-oriented flow are primarily documented through `src/lib/game`, `src/lib/stage`, and `src/lib/core`.
- This package does not currently appear to expose standalone networking, editor, or tooling subsystems as first-class runtime modules, so those are not broken out into separate docs areas here.

## Recommended reading order

If you are new to the package, a good documentation order is:

1. `src/overview.mmd`
2. `src/api/public-api-package-diagram.puml`
3. `src/lib/game/game-startup-sequence.puml`
4. `src/lib/stage/stage-runtime-class-diagram.puml`
5. `src/lib/core/base-node-lifecycle-class-diagram.puml`
6. `src/lib/entities/entity-architecture.puml`
7. `src/lib/behaviors/behavior-runtime-architecture.puml`
8. `src/lib/actions/action-transform-pipeline.puml`
9. `src/lib/camera/camera-subsystem.puml`
10. `src/lib/graphics/scene-rendering.puml`
11. `src/lib/physics/physics-worker-bridge.puml`
12. `src/lib/input/input-subsystem.puml`
13. `src/web-components/zylem-game-runtime.puml`

## Documentation conventions

When adding a new diagram:

- place it in the mirrored docs path for the subsystem it explains
- prefer one diagram per architectural concern
- use explicit file names that describe the diagram purpose
- favor subsystem relationships and lifecycle flow over file-by-file duplication
- update this README when adding or renaming a diagram

## Suggested future additions

As the docs mature, this index can be extended with:

- rendered image links
- per-folder README files
- status tracking for completed diagrams
- cross-links to important source files
- architecture decision notes for major subsystem changes
