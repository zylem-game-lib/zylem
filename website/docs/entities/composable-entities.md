---
title: Composable entities
description: create(), mesh parts, and collision parts
sidebar_position: 3
---

When no single factory matches what you need, start from [create()](/docs/api/entity/functions/create) and attach **parts** with `.add(...)`. Parts are `BaseNode` children produced by mesh and collision helpers exported from `@zylem/game-lib/entity`. The composable API is how built-in factories such as [createBox](/docs/api/entity/functions/createBox) are implemented, and it is the extension point for custom shapes that still participate in spawn, clone, and collision registration.

## Minimal example

`website/snippets/entities/composable-entities.ts`:

```typescript
import { create, boxMesh, boxCollision } from '@zylem/game-lib/entity';

const customBlock = create({ name: 'custom-block', position: { x: -1, y: 1, z: 0 } })
  .add(boxMesh({ size: { x: 2, y: 2, z: 2 }, color: '#4488ff' }))
  .add(boxCollision({ size: { x: 2, y: 2, z: 2 }, static: true }));
```

## Mesh parts

| Helper | Geometry |
| --- | --- |
| [boxMesh](/docs/api/entity/functions/boxMesh) | Box |
| [sphereMesh](/docs/api/entity/functions/sphereMesh) | Sphere |
| [coneMesh](/docs/api/entity/functions/coneMesh) | Cone |
| [cylinderMesh](/docs/api/entity/functions/cylinderMesh) | Cylinder |
| [pyramidMesh](/docs/api/entity/functions/pyramidMesh) | Pyramid |
| [pillMesh](/docs/api/entity/functions/pillMesh) | Capsule-style pill |

Mesh helpers accept `size`, `color`, and `material` overrides consistent with primitive factories.

## Collision parts

| Helper | Rapier shape |
| --- | --- |
| [boxCollision](/docs/api/entity/functions/boxCollision) | Box |
| [sphereCollision](/docs/api/entity/functions/sphereCollision) | Ball |
| [coneCollision](/docs/api/entity/functions/coneCollision) | Cone |
| [cylinderCollision](/docs/api/entity/functions/cylinderCollision) | Cylinder |
| [pyramidCollision](/docs/api/entity/functions/pyramidCollision) | Convex hull |
| [pillCollision](/docs/api/entity/functions/pillCollision) | Capsule |
| [planeCollision](/docs/api/entity/functions/planeCollision) | Static box under a plane |
| [zoneCollision](/docs/api/entity/functions/zoneCollision) | Sensor volume (see [Zones](/docs/entities/zones-and-triggers)) |

Each collision part implements [CollisionComponent](/docs/api/entity/interfaces/CollisionComponent) so the entity builder can register bodies with the simulation.

## Advanced composition

- **Order** — add mesh parts before collision parts if you rely on debug visualization; the builder merges all parts at spawn.
- **Bare entity** — `create()` alone has no render or physics until you `.add(...)` at least one part.
- **Custom factories** — wrap `create(...).add(...)` in your own function and pass the result through [createEntityFactory](/docs/api/entity/functions/createEntityFactory) for template spawning.

## Pitfalls

- Mismatched mesh and collider dimensions produce visible gaps or invisible walls—keep `size` (or shape-specific fields) aligned.
- Collision parts honor `static`, `sensor`, and filter fields on the part options as well as top-level `GameEntityOptions`.
- Only entities from official helpers support `clone()`; if you subclass `GameEntity` directly, wire [finalizeEntityCloneSupport](/docs/api/entity/functions/createEntity) the way built-in factories do.

## API reference

- [create](/docs/api/entity/functions/create)
- [CollisionComponent](/docs/api/entity/interfaces/CollisionComponent)
- Mesh helpers: [boxMesh](/docs/api/entity/functions/boxMesh), [sphereMesh](/docs/api/entity/functions/sphereMesh), [coneMesh](/docs/api/entity/functions/coneMesh), [cylinderMesh](/docs/api/entity/functions/cylinderMesh), [pyramidMesh](/docs/api/entity/functions/pyramidMesh), [pillMesh](/docs/api/entity/functions/pillMesh)
- Collision helpers: [boxCollision](/docs/api/entity/functions/boxCollision), [sphereCollision](/docs/api/entity/functions/sphereCollision), [planeCollision](/docs/api/entity/functions/planeCollision), [zoneCollision](/docs/api/entity/functions/zoneCollision)
