---
title: Core concepts
description: Game, stage, entity, behavior, action, simulation, and runtime
sidebar_position: 4
---

Zylem organizes runtime code around a few composable ideas: a **game** loop owns **stages**, each stage owns **entities**, and entities gain capabilities through **behaviors** and **actions**. Understanding where each layer lives helps you pick the right import path and avoid fighting the frame pipeline.

## Game

The **game** is the object returned by [createGame](/docs/api/core/functions/createGame). It resolves configuration (container, input defaults, globals), loads the first **stage**, and drives the requestAnimationFrame loop. Call [start()](/docs/api/core/classes/Game#start) once the DOM is ready.

Game-wide hooks (`onSetup`, `onUpdate`, `onDestroy`, global change subscriptions, and loading events) live on the `Game` instance. Disposing the game tears down stages, the simulation, and renderer resources in order.

## Stage

A **stage** is a scene slice: camera, lighting, background, entities, and stage-local config. Factory: [createStage](/docs/api/core/functions/createStage). Stages can be passed directly to `createGame(createStage({ … }), entity)` or listed on a config object’s `stages` field.

[StageManager](/docs/api/core/variables/StageManager) handles navigation between stages when you build multi-level flows (covered in [Stages](/docs/game-and-stages/stages)).

## Entity

An **entity** is a `GameEntity` subclass created by helpers such as [createSphere](/docs/api/entity/functions/createSphere), `createActor`, sprites, UI nodes, and zones. Entities have transforms, optional colliders, lifecycle callbacks (`onSetup`, `onUpdate`, `onDestroy`), and methods like `moveXY` for common motion.

Entities are plain TypeScript objects you construct before `start()`; the stage spawns them into the scene graph and simulation registry when the game loads.

## Behavior

A **behavior** is attached with `entity.use(BehaviorDescriptor, options?)`. Each descriptor bundles:

- configuration validated at attach time,
- an optional **handle** returned from `use()` for imperative control,
- a stage-scoped **system** that runs with simulation data,
- and often an **FSM** inside `@zylem/behaviors` for stateful logic.

Example: [WorldBoundary2DBehavior](/docs/api/behavior/variables/WorldBoundary2DBehavior) clamps motion to a rectangle. Gameplay behaviors import from `@zylem/game-lib/behavior`.

## Action

An **action** is a higher-level timed or persistent helper built on the action graph—sequences, tweens, intervals, and reactive property changes. Import from `@zylem/game-lib/actions` when you choreograph motion or effects without writing a full behavior.

Actions suit cutscenes, UI flourishes, and one-off animations; behaviors suit reusable simulation rules shared across entities.

## Perspective

A **perspective** defines how the stage camera frames the world (third person, first person, fixed, and variants). Perspectives are configured on the stage or camera feed, not on every entity. See the [Camera](/docs/camera/overview) section for pipeline details.

## Simulation and runtime

**Simulation** refers to `@zylem/behaviors`: `createSimulation()`, entity registry, behavior FSMs, and the bridge into WASM. Game-lib forwards inputs each frame, calls `simulation.update(delta)`, then writes interpolated poses to Three.js objects.

**Runtime** is `@zylem/runtime`—the prebuilt WASM module (ECS + Rapier). Games normally never import it; advanced tooling can use [game.experimental.getRuntime()](/docs/api/core/classes/Game#experimental) on a live game.

```mermaid
sequenceDiagram
  participant Loop as Game loop
  participant GL as game-lib
  participant Sim as Simulation
  participant WASM as runtime WASM
  participant THREE as Three.js
  Loop->>GL: entity onUpdate / behaviors
  GL->>Sim: behavior inputs
  Sim->>WASM: fixed timestep physics
  WASM-->>Sim: poses and events
  Sim-->>GL: snapshots
  GL->>THREE: sync meshes and cameras
  GL->>THREE: render frame
```

## Import map (mental model)

| Concept | Typical import |
| --- | --- |
| Game, stage, camera | `@zylem/game-lib/core` |
| Entity factories | `@zylem/game-lib/entity` |
| Behaviors | `@zylem/game-lib/behavior` |
| Actions | `@zylem/game-lib/actions` |
| Input presets | `@zylem/game-lib/input` |
| Web component host | `@zylem/game-lib/web-components` |

Never import from a root `@zylem/game-lib` barrel in application code; subpaths keep bundles small and match the public API surface.

## Pitfalls

- **Behavior vs. action** — if it needs physics or cross-entity simulation state, prefer a behavior; if it is a one-off timeline on one entity, prefer an action.
- **Stage vs. game scope** — globals and `Game.onUpdate` are game-wide; entity `onUpdate` is per-entity; behavior systems are stage-scoped unless documented otherwise.
- **Starting too early** — construct entities and call `use()` before `start()`; do not assume the WebGL context exists in module top-level code.

## API reference

- [createGame](/docs/api/core/functions/createGame)
- [createStage](/docs/api/core/functions/createStage)
- [Game](/docs/api/core/classes/Game)
- [GameEntity](/docs/api/entity/interfaces/GameEntity)
- [Behavior module index](/docs/api/behavior)
- [Actions module index](/docs/api/actions)
