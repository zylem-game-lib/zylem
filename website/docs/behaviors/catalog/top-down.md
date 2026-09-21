---
title: Top-down movement
description: Twin-stick and keyboard top-down locomotion
sidebar_position: 4
---

`TopDownMovementBehavior` drives X/Y (or configured plane) locomotion in WASM. Write `$topDownMovement` each frame with `moveX`, `moveY`, and optional `faceX` / `faceY` for twin-stick aiming. When `faceMovement` is true, the runtime rotates toward velocity; leave it false when a separate aim vector or `Shooter2DBehavior` owns facing.

## Minimal example

`website/snippets/behaviors/catalog/top-down.ts`:

```typescript
import { TopDownMovementBehavior } from '@zylem/game-lib/behavior';

const topDown = mover.use(TopDownMovementBehavior, {
  moveSpeed: 8,
  faceMovement: true,
});

mover.onUpdate(({ inputs }) => {
  mover.$topDownMovement.moveX = inputs.p1.axes.Horizontal.value;
  mover.$topDownMovement.moveY = inputs.p1.axes.Vertical.value;
  mover.$topDownMovement.faceX = inputs.p1.axes.SecondaryHorizontal.value;
  mover.$topDownMovement.faceY = inputs.p1.axes.SecondaryVertical.value;
});
```

## Handle

- `getFacingAngle()` — radians, also stored on `topDownMovementState.facingAngle` for shooters.

## Variations

- Pair with `Shooter2DBehavior` and `TopDownShooterCoordinator` for move + aim + fire in one call.
- `getEntityFacingAngle2D` falls back to body rotation or cached 2D angle when composing custom fire logic.

## Pitfalls

- Requires spawn and behavior system tick before `$topDownMovement` exists (same as other WASM behaviors).
- Do not manually set entity rotation every frame if `faceMovement` or top-down state already drives facing.

## API reference

- [`TopDownMovementBehavior`](/docs/api), [`TopDownMovementHandle`](/docs/api)
- [`TopDownShooterCoordinator`](/docs/api)
- Generated reference: [API](/docs/api)
