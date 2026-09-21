---
title: Destructible 3D
description: Voronoi fracture and fragment physics
sidebar_position: 11
---

`Destructible3DBehavior` fractures render meshes using `@dgreenheck/three-pinata` (`FractureOptions`, `DestructibleMesh`) and produces fragment collider/body definitions for the WASM stage. Use it on breakable props, crates, and walls where visual shards should match physics debris.

## Minimal example

`website/snippets/behaviors/catalog/destructible-3d.ts`:

```typescript
import { Destructible3DBehavior } from '@zylem/game-lib/behavior';

const destructible = crate.use(Destructible3DBehavior, {
  fragmentPhysics: {
    mode: 'independent',
    outwardVelocity: 4,
  },
});

crate.onCollision(() => {
  if (!destructible.isFractured()) {
    destructible.fracture();
  }
});
```

## Options

| Field | Role |
| --- | --- |
| `fractureOptions` | Voronoi/chip settings passed to pinata. |
| `innerMaterial` | Interior material after fracture. |
| `collider` | Fragment shape (`convexHull`, `cuboid`, `trimesh`), sensor, groups. |
| `fragmentPhysics` | Compound vs independent bodies, inherited velocity, outward impulse. |
| `prebakeWorkerUrl` | Optional worker URL for async Voronoi prebake. |

## Handle

- `fracture()`, `prebake()`, `prebakeAsync()`, `repair()`, `isFractured()`, `getFragments()`.

Host code attaches fragment entities to the simulation using the plain-data definitions the behavior emits.

## Pitfalls

- Target entities need destructible geometry; simple boxes may need mesh setup compatible with pinata.
- Prebake reduces hitch on first break but requires worker bundle deployment.
- `repair()` restores visuals; re-sync colliders if fragments were spawned into the world.

## API reference

- [`Destructible3DBehavior`](/docs/api), [`Destructible3DHandle`](/docs/api)
- [`FractureOptions`](/docs/api), [`DestructibleMesh`](/docs/api)
- Generated reference: [API](/docs/api)
