---
title: First person
description: WASD movement, mouse look, and viewmodels
sidebar_position: 5
---

`FirstPersonBehavior` combines WASM first-person locomotion with presentation sync to a `FirstPersonPerspective`. Write `$fps` for move, look, and sprint; optional viewmodel config parents a weapon mesh to the camera. Jumping in FPS templates often adds `Jumper3DBehavior` via [FirstPersonShooterCoordinator](/docs/behaviors/coordinators).

## Minimal example

`website/snippets/behaviors/catalog/first-person.ts`:

```typescript
import { createCamera, Perspectives } from '@zylem/game-lib/core';
import { FirstPersonBehavior } from '@zylem/game-lib/behavior';

const camera = createCamera({ perspective: Perspectives.FirstPerson });
const fps = camera.getPerspective();

player.use(FirstPersonBehavior, {
  perspective: fps,
  walkSpeed: 8,
  runSpeed: 16,
  lookSensitivity: 2,
});

player.onUpdate(({ inputs }) => {
  player.$fps.moveX = inputs.p1.axes.Horizontal.value;
  player.$fps.moveZ = inputs.p1.axes.Vertical.value;
  player.$fps.lookX = inputs.p1.axes.SecondaryHorizontal.value;
  player.$fps.lookY = inputs.p1.axes.SecondaryVertical.value;
  player.$fps.sprint = inputs.p1.shoulders.LTrigger.held > 0;
});
```

## Options

| Option | Role |
| --- | --- |
| `walkSpeed`, `runSpeed` | Ground speed caps. |
| `lookSensitivity` | Scales look axes written to `$fps`. |
| `eyeHeight` | Eye offset above entity origin. |
| `perspective` | `FirstPersonPerspective` from the active camera. |
| `viewmodel` | Entity, offset, optional `cameraObject` for jitter-free weapons. |

## Handle

- `getState()`, `getYaw()`, `getPitch()`, `attachViewmodel(...)`.

## Pitfalls

- Pass `skipDebugOrbit` on the camera when debug orbit would fight mouse-look.
- Simulation runs in WASM; `FirstPersonPresentation` only syncs camera/viewmodel from runtime poses.
- Pair with a capsule collider and grounded stage geometry.

## API reference

- [`FirstPersonBehavior`](/docs/api), [`FirstPersonFSM`](/docs/api)
- [`FirstPersonShooterCoordinator`](/docs/api)
- Generated reference: [API](/docs/api)
