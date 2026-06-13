# physics

The **physics** directory contains utilities for inspecting and interpolating Rapier rigid-body poses, used both by the game loop and by the WASM runtime integration.

## Files

| File | Role |
|---|---|
| `collider-desc-inspect.ts` | `inspectColliderDesc(desc)` — reads the shape kind and dimension data off a `ColliderDesc` without calling WASM accessors; used in tests and in the runtime serialisation path |
| `physics-pose.ts` | `PhysicsPose`, `capturePhysicsPose`, `interpolatePhysicsPose`, and related helpers — snapshot + lerp utilities that smooth rendered positions between physics steps |

## How it fits in

`physics-pose.ts` is central to the sub-step interpolation strategy. Rapier runs at a fixed timestep while the renderer runs at the display frame rate. After each physics step, `capturePhysicsPose` snapshots the body's transform; `interpolatePhysicsPose` then blends the previous and current snapshots by the fractional time-step remainder so rendered positions appear smooth even at 120 fps or above.

`collider-desc-inspect.ts` is used in tests (to assert on collider dimensions without a running physics world) and by the WASM runtime's serialisation layer, which needs to describe shapes across the JS/Rust boundary without holding live Rapier objects.
