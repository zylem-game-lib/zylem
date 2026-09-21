---
title: Runtime colliders
description: buildBoxCollider, buildRuntimeBody, and plain-data shapes
sidebar_position: 3
---

Most games attach collision through **entity factories** (`createBox`, `boxCollision`, …). The `@zylem/game-lib/runtime` module exposes **plain-data builders** that mirror those shapes without Rapier types — useful for custom spawners, editor export, or tools that talk to `Simulation.spawn` directly.

See `website/snippets/physics/runtime-collider-build.ts`.

## Body builder

`buildRuntimeBody(options?)` returns `StageBodyConfig`:

- `kind` — `StageBodyKind.Static` or `StageBodyKind.Dynamic`
- `position`, `rotation` quaternion
- Damping, `gravityScale`, `canSleep`, `ccdEnabled`
- `lockRotation`, `lockTranslation` axis tuples

Defaults match entity factory bodies (dynamic, CCD on, sleep off).

## Collider builders

| Function | Shape |
| --- | --- |
| `buildBoxCollider(size, opts?)` | Cuboid — **full extents**; half-extents computed internally |
| `buildSphereCollider(radius, opts?)` | Sphere |
| `buildCapsuleCollider(halfHeight, radius, opts?)` | Capsule |
| `buildCylinderCollider(halfHeight, radius, opts?)` | Cylinder |
| `buildConvexHullCollider(vertices, opts?)` | Convex hull point cloud |
| `buildTrimeshCollider(vertices, indices, opts?)` | Triangle mesh |
| `buildHeightfieldCollider(rows, cols, heights, scale, opts?)` | Height field |

Collider options mirror entity collision: `offset`, `friction`, `restitution`, `sensor`, `collisionType`, `collisionFilter`.

## Bundling

`bundleRuntimeCollision(body, colliders)` returns `{ body, colliders }` — the shape expected when uploading spawn payloads to the simulation layer.

## Relationship to entity components

`boxCollision()` inside game-lib produces `CollisionComponent` objects (`bodyDesc` + `colliderDesc`) consumed by `GameEntity.add`. Runtime builders emit the same underlying **StageBodyConfig** / **StageColliderConfig** types — choose whichever entry point fits your pipeline.

## Pitfalls

- **Size semantics**: Box builders take **full size**, not half-extents.
- **Trimesh cost**: Prefer primitives or convex hulls for dynamic bodies; trimesh is best for static level collision.
- **Live edits**: Body locks and gravity scale apply at spawn; there is no FFI to change every field live after spawn.

## API reference

- [buildRuntimeBody](/docs/api/runtime/functions/buildRuntimeBody), [buildBoxCollider](/docs/api/runtime/functions/buildBoxCollider), [buildSphereCollider](/docs/api/runtime/functions/buildSphereCollider), [buildCapsuleCollider](/docs/api/runtime/functions/buildCapsuleCollider), [buildCylinderCollider](/docs/api/runtime/functions/buildCylinderCollider), [buildConvexHullCollider](/docs/api/runtime/functions/buildConvexHullCollider), [buildTrimeshCollider](/docs/api/runtime/functions/buildTrimeshCollider), [buildHeightfieldCollider](/docs/api/runtime/functions/buildHeightfieldCollider)
- [bundleRuntimeCollision](/docs/api/runtime/functions/bundleRuntimeCollision), [RuntimeCollisionBundle](/docs/api/runtime/interfaces/RuntimeCollisionBundle)
