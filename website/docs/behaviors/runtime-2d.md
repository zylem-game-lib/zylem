---
title: Runtime 2D
description: WASM-backed 2D descriptors consumed by the simulation
sidebar_position: 3
---

Runtime 2D descriptors are special behaviors exported from `@zylem/game-lib/behavior` (via `@zylem/behaviors/runtime-2d`). They act as attach markers for the WASM **gameplay2d** stage adapter: there is no TypeScript-side behavior system for them. When an entity uses `RuntimePlayerInput2DBehavior` or `RuntimeBoundary2DBehavior`, the runtime registers the corresponding simulation feature during spawn instead of running hot-path logic in JavaScript.

Use runtime 2D when you want Pong-style or arcade 2D scenes where input, circle bodies, boundaries, ricochet, triggers, and goal zones should live entirely in WASM. For general game entities with Rapier colliders and TS behavior systems, prefer the regular catalog behaviors (`Platformer2DBehavior`, `WorldBoundary2DBehavior`, …).

## Minimal example

`website/snippets/behaviors/runtime-2d.ts`:

```typescript
import { createGame } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';
import {
  RuntimeBoundary2DBehavior,
  RuntimeDynamicCircleBody2DBehavior,
  RuntimePlayerInput2DBehavior,
} from '@zylem/game-lib/behavior';

const paddle = createSphere({ name: 'paddle' });
paddle.use(RuntimeDynamicCircleBody2DBehavior, { initialVelocity: [0, 0] });
paddle.use(RuntimePlayerInput2DBehavior, { player: 'p1', speed: 12 });

paddle.use(RuntimeBoundary2DBehavior, {
  boundaries: { left: -8, right: 8, bottom: -4.5, top: 4.5 },
});

createGame(paddle).start();
```

## Descriptor reference

| Descriptor | Purpose |
| --- | --- |
| `RuntimeDynamicCircleBody2DBehavior` | Dynamic circle body; handle can set/read runtime pose and velocity when bound. |
| `RuntimePlayerInput2DBehavior` | Maps a player slot (`p1` / `p2`) and speed into WASM input. |
| `RuntimeBoundary2DBehavior` | Axis-aligned world bounds (same hit semantics as `WorldBoundary2DBehavior`). |
| `RuntimeRicochet2DBehavior` | WASM ricochet with `onRicochet` events (`wall` / `paddle`). |
| `RuntimeTriggerRegion2DBehavior` | Sensor AABB; fires enter events through `emitRuntimeTriggerRegionEnter`. |
| `RuntimeGoalZone2DBehavior` | Score zones; goals via `emitRuntimeGoal`. |

Symbol keys such as `RUNTIME_BOUNDARY_2D_BEHAVIOR_KEY` identify refs when bridging from host code.

## Host glue

- `bindRuntimeDynamicCircleBody2DHandle` connects a behavior ref to host setters/getters for position and velocity.
- `emitRuntimeRicochet`, `emitRuntimeTriggerRegionEnter`, and `emitRuntimeGoal` forward WASM events into behavior refs for gameplay callbacks.

## Pitfalls

- Do not mix runtime 2D markers with the TS `WorldBoundary2DBehavior` on the same entity unless you intend two parallel boundary models.
- Handles on runtime descriptors are thin; most simulation state lives in WASM snapshots, not FSMs on the ref.
- Runtime 2D is separate from `@zylem/behaviors/core` simulation helpers used by FSM-based behaviors.

## API reference

- Runtime 2D exports on `@zylem/game-lib/behavior` (`RuntimeBoundary2DBehavior`, `RuntimePlayerInput2DBehavior`, …)
- [`bindRuntimeDynamicCircleBody2DHandle`](/docs/api), [`emitRuntimeRicochet`](/docs/api)
- Generated reference: [API](/docs/api)
