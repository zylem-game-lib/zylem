---
title: Debug tools
description: Editor gizmos, selection, snap, and thumbnails
sidebar_position: 4
---

When debug mode is on, game-lib renders editor tooling: transform gizmos, construction grid, selection/hover highlights, snap increments, and entity thumbnails for the bridge. State lives in `@zylem/game-lib/debug` and syncs from the `zylem-game` element `state` property or bridge commands (`debug:set`, `tool:set`, `snap:set`, `grid:set`, …).

## Debug state

`debugState` (valtio proxy) holds:

- `enabled` — master debug flag
- Current tool, pause, selection and hover entity ids (single + multi-select lists)
- Add-tool armed type, pick mode, snap settings, grid visibility

Setters include `setDebugTool`, `setPaused`, `setSelectedEntity` / `setSelectedEntityIds`, `setHoveredEntityId`, `setAddType`, `setPickMode`, `setSnapSettings`, `setGridVisible`.

Tools: `select`, `translate`, `rotate`, `scale`, `delete`, `add`, `none`. Transform tools (`TRANSFORM_TOOLS`) drive the gizmo; `isTransformTool` checks membership.

Register `registerDebugEntityResolver` when entity ids need custom lookup for picking or summaries.

## Transform gizmo

`TransformGizmo` implements axis dragging with ray/plane math exported for tests and extensions:

- `GizmoMode`, `GizmoAxis`, `GizmoDelta`, `GizmoRay`
- Helpers: `closestAxisValue`, `intersectPlane`

Snap helpers in the same module: `snapToIncrement`, `snapVec3`, `snapScale`, quaternion/Euler conversions (`eulerToQuaternion`, `quaternionToEuler`).

Default snap: `DEFAULT_SNAP_SETTINGS` (translation, rotation radians, scale step).

## Construction grid

`ConstructionGrid` draws a ground reference; visibility follows `setGridVisible` / bridge `grid:set`.

## Focus and bounds

- `focusEntity` / `registerEntityFocusContext` — frame selected entity in the camera (bridge `entity:focus`).
- `resolveSelectionBounds`, `measureObjectSelectionBounds`, `padSelectionBounds` — selection box sizing for gizmos and thumbnails (margins exported as constants).

## Entity thumbnails

`EntityThumbnailCache` renders framed preview images published on `entity:thumbnail` (blob or data URLs plus world bounds). The cache deduplicates work across entity upserts.

## Bridge integration

| Editor command | Debug API |
| --- | --- |
| `debug:set` | `debugState.enabled` |
| `tool:set` | `setDebugTool` |
| `playback:set` | `setPaused` |
| `entity:select` | selection setters |
| `snap:set` | `setSnapSettings` |
| `grid:set` | `setGridVisible` |
| `add:type:set` | `setAddType` |
| `pick:mode:set` | `setPickMode` |

Game publishes `entity:selection` when selection changes from gizmo clicks or marquee.

## Enabling from host code

```typescript
import {
  debugState,
  setDebugTool,
  setGridVisible,
  DEFAULT_SNAP_SETTINGS,
  setSnapSettings,
} from '@zylem/game-lib/debug';

debugState.enabled = true;
setDebugTool('translate');
setGridVisible(true);
setSnapSettings({ ...DEFAULT_SNAP_SETTINGS, enabled: true });
```

## Pitfalls

- **Debug off** — gizmos and picking no-op; enable before sending transform commands.
- **Quaternion vs Euler** — bridge transforms prefer `quaternion` when supplied to avoid gimbal drift.
- **Pick mode** — while armed, `entity:pick` also updates hover highlight for swatch drops.

## API reference

- [`debugState`](/docs/api/debug/variables/debugState)
- [`TransformGizmo`](/docs/api/debug/classes/TransformGizmo)
- [`EntityThumbnailCache`](/docs/api/debug/classes/EntityThumbnailCache)
- [`focusEntity`](/docs/api/debug/functions/focusEntity)
