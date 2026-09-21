---
title: Debugging physics
description: Debug wireframes, game.experimental.getRuntime, and inspection
sidebar_position: 4
---

Physics debugging spans **in-game debug mode** (editor bridge) and optional **programmatic** access to the simulation.

## Collider wireframes (debug mode)

When debug is enabled (`debug: true` in game config or `debugState.enabled` via the editor), the stage **debug delegate** draws Rapier collider outlines each frame:

1. Read `world.simulation.getDebugRender()` (WASM debug line list).
2. Upload vertices/colors into a `LineSegments` overlay in the scene.

Wireframes track live transforms — useful to verify offset colliders, sensor sizes, and static vs dynamic registration.

This path is active while debug mode runs; it is not meant for shipping builds.

## game.experimental.getRuntime()

```ts
const simulation = game.experimental.getRuntime();
if (simulation) {
	const debug = simulation.getDebugRender();
	// debug.vertices, debug.colors — same data as the overlay
}
```

Returns the `@zylem/behaviors` **Simulation** for the **current stage**, or `null` before load / after dispose. Documented on `Game.experimental` as unstable — intended for tooling, not gameplay logic.

Typical uses:

- Custom debug UI listing body count or timestep
- Exporting collider debug geometry to glTF
- Verifying spawn payloads in integration tests

Do not mutate simulation internals unless you accept breakage across versions.

## SimulationBody (game-lib)

Entities with physics expose `SimulationBody` helpers (read pose, apply impulses/teleports through the documented API). Prefer entity methods during gameplay; use `SimulationBody` when writing behaviors that sit between game-lib and the simulation layer.

## Physics rate and stepping

`stageConfig({ physicsRate: 60 })` sets the fixed timestep (`1 / rate`). With debug **pause**, rendering and debug overlays can still tick while fixed `step()` is gated — wireframes remain aligned with the frozen simulation state.

## Enabling collision events for tests

Collision events start disabled for performance. Any `onCollision` registration enables them world-wide — in tests, register a noop listener if you need events without gameplay callbacks.

## Pitfalls

- **Holding Simulation references** across `nextStage` — always re-fetch from `getRuntime()` after navigation.
- **Debug render cost** — large worlds generate many lines; disable debug in performance captures.
- **Rapier types in game code** — use runtime builders and `@zylem/game-lib/runtime` types instead of importing `@dimforge/rapier` in game projects.

## API reference

- [game.experimental.getRuntime](/docs/api/core/classes/Game#experimental) (see `Game` class experimental namespace)
- [Simulation](/docs/api/runtime/interfaces/Simulation), [StageDebugRender](/docs/api/runtime/interfaces/StageDebugRender)
- [SimulationBody](/docs/api/runtime/classes/SimulationBody)
