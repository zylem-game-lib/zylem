---
title: Coordinators
description: Input orchestration layers that wire behaviors together
sidebar_position: 2
---

Coordinators sit in `@zylem/behaviors` and translate a single per-frame input object into the right behavior input components and handle calls. They do not replace behaviors: they fan out player intent so you avoid repeating the same `$thruster`, `$topDownMovement`, and `fireShooter2DIfRequested` wiring in every `onUpdate`. Reach for a coordinator when a control scheme always drives the same bundle of behaviors together.

## Minimal example

See `website/snippets/behaviors/coordinators.ts` for a typed top-down shooter setup:

```typescript
import { createSphere } from '@zylem/game-lib/entity';
import {
  Shooter2DBehavior,
  TopDownMovementBehavior,
  TopDownShooterCoordinator,
} from '@zylem/game-lib/behavior';

const player = createSphere({ name: 'player' });
const shooter = player.use(Shooter2DBehavior, {
  projectileFactory: () => createSphere({ name: 'bullet' }),
  projectileSpeed: 24,
});
player.use(TopDownMovementBehavior, { moveSpeed: 10 });

const coordinator = new TopDownShooterCoordinator(player, shooter, stage);

player.onUpdate(({ inputs }) => {
  coordinator.update({
    moveX: inputs.p1.axes.Horizontal.value,
    moveY: inputs.p1.axes.Vertical.value,
    aimX: inputs.p1.axes.SecondaryHorizontal.value,
    aimY: inputs.p1.axes.SecondaryVertical.value,
    shootPressed: inputs.p1.buttons.A.pressed,
    shootHeld: inputs.p1.buttons.A.held > 0,
  });
});
```

Pass a stage-like object with an `add` method so `Shooter2DBehavior` can spawn projectiles.

## Available coordinators

| Class | Drives | Typical use |
| --- | --- | --- |
| `TopDownShooterCoordinator` | `$topDownMovement` + `Shooter2DHandle` | Twin-stick or keyboard twin-stick shooters on the X/Y plane. |
| `MultidirectionalSpaceShooterCoordinator` | `$thruster`, entity rotation, `Shooter2DHandle` | Asteroids-style thrust plus aim-to-shoot. |
| `FirstPersonShooterCoordinator` | `$fps`, `$jumper` (3D jump input) | FPS move/look/sprint/jump with camera-relative air control. |
| `BoundaryRicochetCoordinator` | `WorldBoundary2DHandle` + `Ricochet2DHandle` | Paddle/ball games: snap at bounds and reflect velocity. |
| `BoundaryRicochet3DCoordinator` | 3D boundary + ricochet handles | Same glue for 3D bounds. |

Shared helper `updateBoundaryRicochet` implements the boundary-hit → normal → ricochet sequence both boundary coordinators use.

## Variations

- Call `fireShooter2DIfRequested` directly when you only need firing without a full coordinator class.
- Use `resolveAim2D` and `getEntityFacingAngle2D` when you custom-map aim but still want consistent 2D facing.
- Construct coordinators once after `entity.use(...)`; they hold references to handles and entities, not input state.

## Pitfalls

- Coordinators assume required behaviors are already attached (`TopDownShooterCoordinator` needs `Shooter2DBehavior` on the same entity).
- They write input components; they do not create physics bodies or run WASM steps for you.
- `FirstPersonShooterCoordinator` expects a handle that exposes `getYaw()` (from `FirstPersonBehavior`).

## API reference

- [`TopDownShooterCoordinator`](/docs/api)
- [`MultidirectionalSpaceShooterCoordinator`](/docs/api)
- [`FirstPersonShooterCoordinator`](/docs/api)
- [`BoundaryRicochetCoordinator`](/docs/api), [`BoundaryRicochet3DCoordinator`](/docs/api)
- [`updateBoundaryRicochet`](/docs/api), [`fireShooter2DIfRequested`](/docs/api)
- Generated reference: [API](/docs/api)
