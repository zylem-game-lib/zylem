---
title: Collisions
description: Callbacks, filtering, sensors, and collision phases
sidebar_position: 2
---

Collision **geometry** comes from entity factories (`createSphere`, `createBox`, composable `boxCollision`, …). **Callbacks** attach with `entity.onCollision(...)`. The stage **world** dispatches events each frame after WASM simulation steps.

Example: `website/snippets/physics/collision-handler.ts`.

## Callback API

```ts
entity.onCollision((ctx) => {
	const { me, other, phase, contactPoint, normal } = ctx;
}, { phase: 'enter', cooldownMs: 0 });
```

Multiple callbacks are supported. Overloads allow registering several functions at once or one function with options.

### Phases

| Phase | When |
| --- | --- |
| `enter` | Pair newly touching (or sensor begin overlap) |
| `stay` | Sustained contact; use `cooldownMs` to throttle |
| `exit` | Separation |

Simulation events stay off until any entity registers a collision listener, then enable for the whole world.

## Collision groups

Collider factories accept:

- `collisionType` — membership group string (mapped to one of 16 bits)
- `collisionFilter` — list of type strings this collider interacts with

`packCollisionGroups` (runtime builder) packs membership + filter into the u32 WASM expects. Omitting `collisionType` uses full mask defaults.

## Sensors

`sensor: true` generates **intersection** events without physical response — triggers, pickup zones, aim assist volumes. Handlers still run through `onCollision`; phase semantics treat overlap begin/end like contact enter/exit.

## Static vs dynamic

`collision: { static: true }` (or static factories like floors) creates fixed bodies. Dynamic bodies participate in forces, gravity, and CCD (enabled by default on dynamic spawns).

## Raycasts

`ZylemWorld.raycast(origin, direction, maxDistance)` queries the simulation (used by debug pick and gameplay tools). Returns hit uuid/normal/distance when a collider intersects the ray.

## Pitfalls

- **Stay spam**: Always set `cooldownMs` on `stay` handlers that spawn effects or audio.
- **Same entity**: Pairs with identical uuids are ignored in snapshots.
- **Zero gravity locks**: Dynamic bodies in zero-G worlds still default to locked unless you set `lockTranslations` / `lockRotations` explicitly in collision options.

## API reference

- Entity factories: [boxCollision](/docs/api/entity/functions/boxCollision), [sphereCollision](/docs/api/entity/functions/sphereCollision), …
- [packCollisionGroups](/docs/api/runtime/functions/packCollisionGroups)
- [GameEntity.onCollision](/docs/api/entity/interfaces/GameEntity)
