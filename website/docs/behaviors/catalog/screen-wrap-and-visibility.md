---
title: Screen wrap and visibility
description: Toroidal bounds and camera frustum visibility
sidebar_position: 9
---

`ScreenWrapBehavior` teleports entities to the opposite edge of a 2D rectangle (Asteroids-style). An FSM reports center, near-edge, and wrapped states for gameplay or VFX. `ScreenVisibilityBehavior` tracks whether an entity intersects any active camera frustum, with optional enter/exit callbacks and padding.

## Minimal example

`website/snippets/behaviors/catalog/screen-wrap-and-visibility.ts`:

```typescript
import { ScreenWrapBehavior, ScreenVisibilityBehavior } from '@zylem/game-lib/behavior';

const wrap = ship.use(ScreenWrapBehavior, {
  width: 20,
  height: 15,
  centerX: 0,
  centerY: 0,
  edgeThreshold: 2,
});

const visibility = ship.use(ScreenVisibilityBehavior, {
  cameraName: null,
  requireFullyVisible: false,
  padding: 0,
  fallbackSize: null,
  onEnter: ({ entity }) => entity.reveal(),
});
```

## Screen wrap options

| Field | Role |
| --- | --- |
| `width`, `height` | Wrap region size. |
| `centerX`, `centerY` | Region center in world units. |
| `edgeThreshold` | Distance from edge to enter near-edge FSM states. |

Access `wrap.getFSM()?.getState()` for `ScreenWrapState` values.

## Screen visibility options

| Field | Role |
| --- | --- |
| `cameraName` | Restrict to one named camera, or any camera when null. |
| `requireFullyVisible` | Full AABB inside frustum vs any intersection. |
| `padding` | Expand/shrink bounds used for tests. |
| `fallbackSize` | Bounds when no mesh is available. |
| `onChange`, `onEnter`, `onExit` | React to visibility transitions. |

## Handle (visibility)

- `isVisible()`, `isOffscreen()`, `wasJustEntered()`, `wasJustExited()`, `getVisibleCameraNames()`, `getState()`.

## Pitfalls

- Wrap operates in 2D world X/Y; ensure your game camera matches the play plane.
- Visibility depends on renderable bounds; set `fallbackSize` for invisible logic-only entities.
- Just-entered/just-exited flags are one-frame pulses—read them during the behavior system tick order you expect.

## API reference

- [`ScreenWrapBehavior`](/docs/api), [`ScreenVisibilityBehavior`](/docs/api)
- [`ScreenWrapFSM`](/docs/api), [`ScreenVisibilityFSM`](/docs/api)
- Generated reference: [API](/docs/api)
