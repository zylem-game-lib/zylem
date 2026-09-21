---
title: Perspectives
description: Third person, first person, and fixed 2D
sidebar_position: 2
---

A **perspective** is the camera’s base framing mode. Exactly one `CameraPerspective` runs per camera each frame; it produces the starting **CameraPose** before behaviors, actions, and damping.

Use the `Perspectives` constants when creating or switching cameras so strings stay consistent.

## Built-in perspective types

| `Perspectives` value | Class | Projection | Typical use |
| --- | --- | --- | --- |
| `ThirdPerson` | `ThirdPersonPerspective` | Perspective | Follow character, auto-frame multiple targets |
| `FirstPerson` | `FirstPersonPerspective` | Perspective | Eye-height view; yaw/pitch from `look()` |
| `Fixed2D` / `Flat2D` | `Fixed2DPerspective` | Orthographic | Side/top 2D stages |
| `Isometric` | (third-person variant) | Perspective | Fixed distance/height third-person |
| `TopDown` | defaults to third-person | Perspective | Placeholder; use third-person + behavior |

`createCamera({ perspective: Perspectives.ThirdPerson })` installs the matching perspective on the pipeline. Switch at runtime with `camera.setPerspective(Perspectives.FirstPerson, options)`.

## Third person

With **no targets**, the camera uses `initialPosition` / `initialLookAt` from options (seeded from `createCamera`’s `position` and `target`).

With **one target**, the camera sits behind and above the target (`distance`, `height`, optional `shoulderOffset`) and looks at it. **Multiple targets** use a weighted centroid and dynamic distance (`paddingFactor`, `minDistance`).

**Trail delay** (`trailDelay`, default 0.1s) samples target motion slightly in the past so fast vertical motion (jump apex) does not shimmer on high refresh displays.

Key options: `ThirdPersonOptions` — `distance`, `height`, `shoulderOffset`, `targetKey`, `fov`, `trailDelay`.

## First person

Position follows the target entity plus `eyeHeight` (default 1.7). Rotation comes from internal yaw/pitch updated through perspective methods:

```ts
const fps = camera.getPerspective<FirstPersonPerspective>();
fps.look(deltaX, deltaY);
```

Set `skipDebugOrbit: true` on the camera so editor orbit controls do not bypass the pipeline.

`verticalSmoothing` (0–1) can smooth eye height only, hiding physics micro-jitter without lagging horizontal aim. Default `1` disables vertical smoothing.

First-person perspectives set pipeline `damping: 1` (instant commit unless you lower camera-level `damping`).

## Fixed 2D

Orthographic camera at a fixed `position` (default `(0, 0, 10)`) looking toward the XY plane with `zoom` as frustum size. No target following — move entities or add behaviors if the view should scroll.

Pass `zoom` via `createCamera({ perspective: Perspectives.Fixed2D, zoom: 12 })`.

## Factory and custom perspectives

`createPerspective(type, options)` builds a perspective instance for advanced use. Implement `CameraPerspective` (`id`, `getBasePose`, optional `defaults.damping`) and assign with `cameraRef.pipeline.setPerspective(...)` if you extend the engine.

## Pitfalls

- **Unrecognized types** fall back to third person in `createPerspective`.
- **Isometric** is a configured third-person preset, not a separate projection.
- **2D movement** often pairs `Fixed2D` with zero gravity and locked bodies (see [Physics overview](/docs/physics/overview)).

## API reference

- [Perspectives](/docs/api/core/variables/Perspectives), [PerspectiveType](/docs/api/core/type-aliases/PerspectiveType)
- [ThirdPersonPerspective](/docs/api/core/classes/ThirdPersonPerspective), [FirstPersonPerspective](/docs/api/core/classes/FirstPersonPerspective), [Fixed2DPerspective](/docs/api/core/classes/Fixed2DPerspective)
- [createPerspective](/docs/api/core/functions/createPerspective), perspective option interfaces in [core](/docs/api/core)
