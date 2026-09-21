---
title: Shooter 2D
description: Cooldown, aim, and projectile spawning
sidebar_position: 6
---

`Shooter2DBehavior` is a stage-scoped firing helper: given a source entity, aim target, and stage, it spawns projectiles from your factory, applies initial velocity, and respects per-source cooldown state. It does not read gamepad input by itself—wire `fireShooter2DIfRequested` or a [coordinator](/docs/behaviors/coordinators) to connect input.

## Minimal example

`website/snippets/behaviors/catalog/shooter-2d.ts`:

```typescript
import { Shooter2DBehavior, fireShooter2DIfRequested } from '@zylem/game-lib/behavior';

const shooter = gunner.use(Shooter2DBehavior, {
  projectileFactory: () => createSphere({ name: 'bullet' }),
  projectileSpeed: 30,
  cooldownMs: 250,
});

gunner.onUpdate(({ inputs, me }) => {
  fireShooter2DIfRequested(me, shooter, stage, {
    aimX: inputs.p1.axes.SecondaryHorizontal.value,
    aimY: inputs.p1.axes.SecondaryVertical.value,
    shootPressed: inputs.p1.buttons.A.pressed,
    shootHeld: inputs.p1.buttons.A.held > 0,
  });
});
```

## Options

| Option | Role |
| --- | --- |
| `projectileFactory` | Required; returns entity (sync or async). |
| `projectileSpeed` | Initial speed along aim vector. |
| `cooldownMs` | Per-source refractory period. |
| `spawnOffset`, `rotateProjectile` | Spawn tweak and align sprite rotation. |

## Handle

- `isReady(source)`, `fire({ source, stage, target })`.

Aim resolution uses `resolveAim2D` and entity facing from top-down state or 2D rotation helpers.

## Pitfalls

- `stage.add` must accept spawned projectile entities.
- Factory entities should set up velocity in `prependSetup` if you need custom collision groups.
- Cooldown is per source entity state (`shooter2dState`), not global.

## API reference

- [`Shooter2DBehavior`](/docs/api), [`fireShooter2DIfRequested`](/docs/api)
- [`resolveAim2D`](/docs/api), [`getEntityFacingAngle2D`](/docs/api)
- Generated reference: [API](/docs/api)
