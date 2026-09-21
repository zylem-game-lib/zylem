---
title: Mouse and look
description: useMouseLook and screen-center look
sidebar_position: 3
---

Mouse input is configured per player through `GameInputPlayerConfig.mouse`. The mouse provider maps movement and buttons into the shared `InputGamepad` fields so look and fire bindings look like gamepad secondary axes and triggers.

## Pointer-lock look (FPS style)

`useMouseLook(player, { sensitivity? })` enables pointer lock and maps mouse deltas to `axes.SecondaryHorizontal` and `axes.SecondaryVertical`. Left and right mouse buttons map to `shoulders.LTrigger` and `shoulders.RTrigger` by default.

Runnable sample: `website/snippets/input/mouse-and-look.ts`.

```ts
import { useMouseLook } from '@zylem/game-lib/input';

createGame(player)
	.setInputConfiguration(useMouseLook('p1', { sensitivity: 0.003 }))
	.start();
```

Sensitivity defaults to `0.002` on the provider. Tune it per game feel.

## Screen-center look (free cursor)

`useScreenCenterLook(player, { maxLookDegrees?, lookSensitivity? })` keeps the system cursor visible. Pointer offset from the **game canvas center** drives yaw/pitch up to `maxLookDegrees` (default 45°). This mode suits third-person and menu-adjacent cameras.

For manual camera math, `@zylem/game-lib/input` also exports:

- `screenCenterLookTargets(nx, ny, maxDegrees?)` — absolute yaw/pitch targets from normalized center offsets.
- `screenCenterLookDeltas(...)` — frame deltas toward those targets for WASM look pipelines.
- `shortestAngleDelta(from, to)` — utility for wrapping angles.

Read `inputs.p1.pointer.centerX` / `centerY` (−1 … 1) when you need raw cursor position.

## Basic mouse without look

`useMouse(player, { sensitivity? })` attaches the provider without pointer lock. Custom bindings go in `mouse.mapping` on `GameInputConfig` if you need non-default button or axis targets.

## Pitfalls

- Pointer lock is ignored while the debug overlay consumes mouse events.
- Screen-center look uses the game canvas bounding rect; embed the game in a stable-sized container for consistent aim.
- Secondary axes may still carry gamepad right-stick input; merge carefully in split-screen.

## API reference

- [useMouseLook](/docs/api/input/functions/useMouseLook)
- [useScreenCenterLook](/docs/api/input/functions/useScreenCenterLook)
- [useMouse](/docs/api/input/functions/useMouse)
- [screenCenterLookTargets](/docs/api/input/functions/screenCenterLookTargets)
- [screenCenterLookDeltas](/docs/api/input/functions/screenCenterLookDeltas)
