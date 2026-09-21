---
title: World boundary
description: Clamp movement at axis-aligned bounds
sidebar_position: 7
---

`WorldBoundary2DBehavior` and `WorldBoundary3DBehavior` track when an entity crosses axis-aligned world limits and expose helpers to clamp movement along blocked axes. Hit semantics: left when x ≤ left, right when x ≥ right, bottom when y ≤ bottom, top when y ≥ top (3D adds Z faces). FSM coarse state is inside vs touching; the detailed hit set lives in extended state updated each frame.

## Minimal example (2D)

`website/snippets/behaviors/catalog/world-boundary.ts`:

```typescript
import { WorldBoundary2DBehavior } from '@zylem/game-lib/behavior';

const boundary = ship.use(WorldBoundary2DBehavior, {
  boundaries: { top: 4, bottom: -4, left: -7, right: 7 },
});

ship.onUpdate(({ me, inputs, delta }) => {
  let moveX = inputs.p1.axes.Horizontal.value * 500 * delta;
  let moveY = -inputs.p1.axes.Vertical.value * 500 * delta;
  const clamped = boundary.getMovement(moveX, moveY);
  me.moveXY(clamped.moveX, clamped.moveY);
});
```

Pure helpers `computeWorldBoundary2DHits` and `hasAnyWorldBoundary2DHit` (and 3D equivalents) work without attaching the behavior when you only need hit tests.

## Handle

- `getLastHits()` — per-face booleans after spawn.
- `getMovement(moveX, moveY)` — zeros components pushing into a touched face.

## Variations

- For WASM-only arcade scenes, see [Runtime 2D](/docs/behaviors/runtime-2d) `RuntimeBoundary2DBehavior`.
- Pair with [Ricochet](/docs/behaviors/catalog/ricochet) via `BoundaryRicochetCoordinator` when bounds should reflect velocity instead of clamping.

## Pitfalls

- `getLastHits()` returns null until the FSM has updated at least once after spawn.
- Boundaries are world-axis aligned; rotated arenas need custom logic or different colliders.

## API reference

- [`WorldBoundary2DBehavior`](/docs/api), [`WorldBoundary3DBehavior`](/docs/api)
- [`computeWorldBoundary2DHits`](/docs/api), [`hasAnyWorldBoundary3DHit`](/docs/api)
- Generated reference: [API](/docs/api)
