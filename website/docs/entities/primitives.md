---
title: Primitives
description: Boxes, spheres, planes, and solid shapes
sidebar_position: 2
---

Primitive factories build mesh + collider pairs for common solid shapes. Each helper merges defaults, attaches the right [mesh and collision parts](/docs/entities/composable-entities), and returns a typed subclass of `GameEntity` (`ZylemBox`, `ZylemSphere`, and so on). Use them for floors, props, simple obstacles, and prototyping before you swap in actors or sprites.

## Minimal example

See `website/snippets/entities/primitives.ts` for a small scene with several shapes:

```typescript
import { createPlane, createSphere, createBox } from '@zylem/game-lib/entity';

const floor = createPlane({
  tile: { x: 20, y: 20 },
  collision: { static: true },
});

const ball = createSphere({
  size: { x: 0.6, y: 0.6, z: 0.6 },
  position: { x: 0, y: 2, z: 0 },
});
```

## Available factories

| Factory | Role | Notable options |
| --- | --- | --- |
| [createBox](/docs/api/entity/functions/createBox) | Axis-aligned cube / block | `size` (Vector3) |
| [createSphere](/docs/api/entity/functions/createSphere) | Ball | `size` (diameter per axis) |
| [createPlane](/docs/api/entity/functions/createPlane) | Ground or wall sheet | `tile`, `texture`, height maps |
| [createDisk](/docs/api/entity/functions/createDisk) | Flat ring | `innerRadius`, `outerRadius` |
| [createCone](/docs/api/entity/functions/createCone) | Cone | `radius`, `height` |
| [createCylinder](/docs/api/entity/functions/createCylinder) | Cylinder | `radiusTop`, `radiusBottom`, `height` |
| [createPyramid](/docs/api/entity/functions/createPyramid) | Square pyramid | base and height fields on options |
| [createPill](/docs/api/entity/functions/createPill) | Rounded capsule mesh | radius / length style options |

Planes are often **static** colliders (`collision: { static: true }`). Dynamic props leave collision dynamic so Rapier integrates velocity from behaviors or impulses.

## Planes and terrain

[createPlane](/docs/api/entity/functions/createPlane) is the most configurable primitive: tiled textures, subdivisions, `heightMap` / `heightMap2D`, and `randomizeHeight` for quick uneven ground. Size in world units comes from `tile` (width and depth), not from `size`.

## Variations

- Pass a child node as the first argument to merge nested configuration (same pattern as other factories).
- Set [collisionType](/docs/api/entity/type-aliases/GameEntityOptions) and `collisionFilter` to participate in selective collision layers.
- Use [category](/docs/api/entity/type-aliases/GameEntityOptions) and `runtime` options when targeting instanced or environment render paths.

## Pitfalls

- **Units** — `size` on boxes and spheres is full extent, while Rapier colliders are built from half-extents internally; stick to factory helpers instead of hand-rolling collider math.
- **Thin disks** — disks use a very flat cylinder collider; do not rely on them for vertical stacking accuracy.
- **Plane thickness** — the visual plane is thin; collision is a static box under the hood—raise `position.y` so other bodies rest on the surface.

## API reference

- [createBox](/docs/api/entity/functions/createBox) · [ZylemBox](/docs/api/entity/classes/ZylemBox)
- [createSphere](/docs/api/entity/functions/createSphere) · [ZylemSphere](/docs/api/entity/classes/ZylemSphere)
- [createPlane](/docs/api/entity/functions/createPlane) · [ZylemPlane](/docs/api/entity/classes/ZylemPlane)
- [createCone](/docs/api/entity/functions/createCone) · [createCylinder](/docs/api/entity/functions/createCylinder) · [createPyramid](/docs/api/entity/functions/createPyramid) · [createPill](/docs/api/entity/functions/createPill) · [createDisk](/docs/api/entity/functions/createDisk)
