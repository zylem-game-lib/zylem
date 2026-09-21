---
title: Movement and rotation
description: moveXY, wrapAround, rotateEuler, setPosition
sidebar_position: 5
---

The `@zylem/game-lib/actions` module exports imperative transform helpers used from `onUpdate` and behaviors. They operate on the entity `transformStore` and stay separate from timed `moveBy` / `rotateBy` actions.

Use **interval actions** when you want fire-and-forget tweens. Use **movement helpers** when you read input every frame and set velocity or rotation directly.

## Minimal example

Runnable sample: `website/snippets/actions/movement-and-rotation.ts`.

```ts
import { moveXY } from '@zylem/game-lib/actions';

ship.onUpdate(({ me, inputs, delta }) => {
	const dx = inputs.p1.axes.Horizontal.value * 500 * delta;
	const dy = -inputs.p1.axes.Vertical.value * 500 * delta;
	me.moveXY(dx, dy);
	me.wrapAroundXY(8, 4);
});
```

To face movement, pass a `THREE.Vector3` to `rotateInDirection(me, direction)` or call `me.rotateInDirection` on the entity.

## Movement

| API | Role |
| --- | --- |
| `move`, `moveX`, `moveY`, `moveZ`, `moveXY`, `moveXZ` | Set velocity components for this frame |
| `moveForwardXY(entity, speed)` | Forward motion along facing |
| `resetVelocity(entity)` | Clear velocity intent |
| `getPosition` / `getVelocity` | Read state from the store |
| `setPosition`, `setPositionX`, … | Teleport |
| `wrapAroundXY(entity, boundsX, boundsY)` | Wrap in a symmetric XY box |
| `wrapAround3D(entity, boundsX, boundsY, boundsZ)` | Wrap in 3D |

Entity methods such as `me.moveXY` are bound to the same implementations.

## Rotation

| API | Role |
| --- | --- |
| `rotateX`, `rotateY`, `rotateZ` | Incremental quaternion rotation |
| `rotateYEuler`, `rotateEuler` | Apply Euler deltas |
| `rotateInDirection` | Face a movement vector (Y axis) |
| `setRotation`, `setRotationDegrees`, axis variants | Absolute orientation |
| `getRotation` | Read quaternion from the store |

## Transform store utilities

- `createTransformStore()` — used internally when entities are constructed.
- `applyTransformChanges(entity)` — flush dirty transform fields to the visual / physics representation when needed outside the normal loop.

## Pitfalls

- Movement helpers use assignment semantics for velocity; interval `moveBy` uses additive velocity intent for the `actions` channel. Mixing both in one frame is supported, but prefer one style per entity for clarity.
- `rotateInDirection` requires a body for some code paths; pure UI entities may only update the visual group via `transformStore`.
- `wrapAroundXY` takes half-extents (bounds), not min/max pairs.

## API reference

- [moveXY](/docs/api/actions/functions/moveXY)
- [rotateInDirection](/docs/api/actions/functions/rotateInDirection)
- [wrapAroundXY](/docs/api/actions/functions/wrapAroundXY)
- [setPosition](/docs/api/actions/functions/setPosition)
- [applyTransformChanges](/docs/api/actions/functions/applyTransformChanges)
