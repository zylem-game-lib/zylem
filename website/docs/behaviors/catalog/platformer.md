---
title: Platformer
description: Platformer2D and Platformer3D
sidebar_position: 1
---

`Platformer2DBehavior` and `Platformer3DBehavior` are kinematic character controllers with walk, run, jump (buffer, coyote time, multi-jump, jump-cut), gravity, and slope/autostep settings. The WASM runtime owns the character controller; your game writes `$platformer2D` or `$platformer3D` input each frame and reads state through the handle.

## Minimal example (2D)

See `website/snippets/behaviors/catalog/platformer.ts`:

```typescript
import { Platformer2DBehavior } from '@zylem/game-lib/behavior';

const platformer = player.use(Platformer2DBehavior, {
  walkSpeed: 8,
  runSpeed: 14,
  jumpForce: 12,
  maxJumps: 2,
});

player.onUpdate(({ inputs }) => {
  player.$platformer2D.moveX = inputs.p1.axes.Horizontal.value;
  player.$platformer2D.jump = inputs.p1.buttons.A.held > 0;
  player.$platformer2D.run = inputs.p1.shoulders.LTrigger.held > 0;
});
```

## Options (high level)

| Option | Default (2D) | Notes |
| --- | --- | --- |
| `walkSpeed` / `runSpeed` | 8 / 14 | Horizontal speed on ground. |
| `jumpForce`, `maxJumps` | 12 / 1 | Multi-jump when `maxJumps` > 1. |
| `gravity`, `coyoteTime`, `jumpBufferTime` | 20 / 0.1s / 0.1s | Feel tuning. |
| `jumpCutMultiplier` | 0.5 | Short-hop when releasing jump. |
| `autostep`, `snapToGroundDistance` | small step / 0.2 | SNES-style step-ups and downhill glue. |
| `useAttachedCollider` | true | KCC shape from Rapier collider when true. |

3D adds `moveZ` on `$platformer3D` and uses X/Z locomotion with the same jump feature set.

## Handle

- `getState()` — FSM state (`idle`, `walking`, `running`, `jumping`, `falling`, `landing`).
- `isGrounded()`, `getJumpCount()`.

## Pitfalls

- Vertical motion for 2D platformer uses behavior-owned `verticalVelocity`; do not fight it with manual Y transforms.
- Attach a suitable capsule/box collider before spawn; optional `shape` override requires `useAttachedCollider: false`.
- For jump-only entities without full platformer locomotion, consider [Jumper](/docs/behaviors/catalog/jumper) instead.

## API reference

- [`Platformer2DBehavior`](/docs/api), [`Platformer3DBehavior`](/docs/api)
- [`Platformer2DState`](/docs/api), [`Platformer2DFSM`](/docs/api)
- Generated reference: [API](/docs/api)
