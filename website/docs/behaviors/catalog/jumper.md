---
title: Jumper
description: Jumper2D and Jumper3D
sidebar_position: 2
---

`Jumper2DBehavior` and `Jumper3DBehavior` implement focused jump physics: coyote time, jump buffering, multi-jump, variable jump height, and ground probing. Unlike [Platformer](/docs/behaviors/catalog/platformer), they do not provide a full walk/run character controller—pair them with your own horizontal movement or with `FirstPersonBehavior` / coordinators for FPS-style air control.

## Minimal example (2D)

`website/snippets/behaviors/catalog/jumper.ts`:

```typescript
import { Jumper2DBehavior } from '@zylem/game-lib/behavior';

const jumper = hero.use(Jumper2DBehavior, {
  jumpHeight: 3,
  maxJumps: 2,
  coyoteTimeMs: 120,
});

hero.onUpdate(({ inputs }) => {
  hero.$jumper2d.jumpPressed = inputs.p1.buttons.A.pressed;
  hero.$jumper2d.jumpHeld = inputs.p1.buttons.A.held > 0;
  hero.$jumper2d.jumpReleased = inputs.p1.buttons.A.released;
});
```

## Options

| Option | Role |
| --- | --- |
| `jumpHeight`, `gravity`, `maxFallSpeed` | Arc shape and terminal velocity. |
| `maxJumps`, `resetJumpsOnGround` | Multi-jump and reset rules. |
| `coyoteTimeMs`, `jumpBufferMs` | Forgiving ledge and input timing. |
| `variableJump` | Cut gravity while holding jump. |
| `groundRayLength`, `snapToGroundDistance` | Ground detection and snap. |

3D adds `planar` air control, wall jump reset options, and integrates with `$jumper` input via `FirstPersonShooterCoordinator`.

## Handle

- `getState()`, `isJumping()`, `getJumpsUsed()`, `getJumpsRemaining()` (2D).

## Pitfalls

- Write edge-triggered jump fields (`jumpPressed`, `jumpReleased`) consistently; buffered jumps depend on them.
- 2D jumper uses `transformStore` for vertical velocity intent; avoid duplicating gravity in `onUpdate`.

## API reference

- [`Jumper2DBehavior`](/docs/api), [`Jumper3DBehavior`](/docs/api)
- [`createJumpConfig2D`](/docs/api), [`createJumpInput3D`](/docs/api)
- Generated reference: [API](/docs/api)
