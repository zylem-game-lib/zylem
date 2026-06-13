# camera

The **camera** subsystem manages viewpoint, projection, and rendering setup for each stage. It abstracts Three.js camera creation and the associated WebGL/WebGPU renderer lifecycle behind a small set of high-level classes.

## Files

| File | Role |
|---|---|
| `camera.ts` | `CameraWrapper` — thin wrapper that holds a Three.js camera and exposes position/rotation helpers |
| `camera-debug-delegate.ts` | Adds on-screen debug overlays (axes, stats) to a camera |
| `camera-feed.ts` | Connects a camera to the renderer and drives the per-frame render call |
| `camera-manager.ts` | Manages multiple simultaneous cameras (split-screen, picture-in-picture) |
| `camera-pipeline.ts` | Coordinates post-processing passes (bloom, tone-map, etc.) on top of a renderer |
| `renderer-manager.ts` | Creates and owns the `WebGLRenderer` or `WebGPURenderer`; handles resize events |
| `smoothing.ts` | Lerp / Slerp helpers used by follow-camera behaviors to reduce jitter |
| `types.ts` | Shared camera types (`CameraMode`, `PerspectiveConfig`, etc.) |
| `zylem-camera.ts` | Top-level singleton façade used by the stage; delegates to the sub-components above |
| `behaviors/follow-target.ts` | Behavior that smoothly tracks a target entity each update |
| `perspectives/` | Concrete perspective implementations (see below) |

## Perspectives

The `perspectives/` sub-directory contains the concrete camera modes:

| File | Camera type |
|---|---|
| `fixed-2d-perspective.ts` | Orthographic top-down / side-scroll view locked to the XY plane |
| `first-person-perspective.ts` | First-person view that follows the player entity's head bone |
| `third-person-perspective.ts` | Orbit camera offset behind and above the target entity |
| `index.ts` | Re-exports all three for convenient import |

## How it fits in

The `Stage` class (see `../stage`) creates a `ZylemCamera` on initialization and passes it to every entity lifecycle call as `context.camera`. Entities can read `camera.position`, call `camera.lookAt()`, or attach a perspective by calling `stage.setCamera(new ThirdPersonPerspective(...))`.

The `RendererManager` owns the `<canvas>` element and is wired to the browser `resize` event so the viewport always matches the window dimensions.
