---
title: Ricochet
description: Reflect velocity from collisions and boundaries
sidebar_position: 8
---

`Ricochet2DBehavior` and `Ricochet3DBehavior` compute reflection results from collision normals and optional paddle-style angled deflection. They can return results for manual application or apply velocity through `transformStore` via `applyRicochet`. FSM extended state stores the last result and supports short cooldowns to suppress duplicate bounces.

## Minimal example (boundary glue)

`website/snippets/behaviors/catalog/ricochet.ts` uses `BoundaryRicochetCoordinator`:

```typescript
import {
  BoundaryRicochetCoordinator,
  Ricochet2DBehavior,
  WorldBoundary2DBehavior,
} from '@zylem/game-lib/behavior';

const boundary = ball.use(WorldBoundary2DBehavior, {
  boundaries: { top: 4, bottom: -4, left: -8, right: 8 },
});
const ricochet = ball.use(Ricochet2DBehavior, {
  minSpeed: 3,
  maxSpeed: 18,
  reflectionMode: 'simple',
});

const coordinator = new BoundaryRicochetCoordinator(ball, boundary, ricochet);

ball.onUpdate(() => {
  coordinator.update();
});
```

## Options (2D)

| Option | Default | Notes |
| --- | --- | --- |
| `minSpeed` / `maxSpeed` | 2 / 20 | Clamp reflected speed. |
| `reflectionMode` | `angled` | `simple` mirrors axis; `angled` uses contact offset. |
| `speedMultiplier`, `maxAngleDeg` | 1.05 / 60 | Paddle-style tuning. |

## Handle

- `getRicochet(ctx)`, `applyRicochet(ctx)`, `getLastResult()`, `onRicochet(callback)`.

For entity-on-entity bounces, supply `Ricochet2DCollisionContext` with contact normals (and optional positions/sizes for angled mode).

## Pitfalls

- Call `clearRicochet` after consuming a result when using manual apply paths to avoid stale state.
- `BoundaryRicochetCoordinator` expects the entity to be moveable with `transformStore` velocity channels.
- 3D variant mirrors the same API with 3D normals; use `BoundaryRicochet3DCoordinator` for box bounds.

## API reference

- [`Ricochet2DBehavior`](/docs/api), [`Ricochet3DBehavior`](/docs/api)
- [`BoundaryRicochetCoordinator`](/docs/api), [`updateBoundaryRicochet`](/docs/api)
- Generated reference: [API](/docs/api)
