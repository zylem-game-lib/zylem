---
title: Actors and models
description: Skinned FBX actors, animation, and collision shapes
sidebar_position: 4
---

[createActor](/docs/api/entity/functions/createActor) loads one or more model files (typically FBX), builds skinned meshes, optional animation clips, and a Rapier collider chosen from the mesh bounds. Use actors for humanoids, creatures, and prop models that need skeletal animation rather than sprite frames or primitive shapes.

## Minimal example

`website/snippets/entities/actors-and-models.ts`:

```typescript
import { createActor } from '@zylem/game-lib/entity';

const hero = createActor({
  name: 'hero',
  models: ['/assets/models/hero.fbx'],
  animations: [{ key: 'idle', path: '/assets/animations/hero-idle.fbx' }],
  collisionShape: 'capsule',
});

hero.onSetup(({ me }) => {
  me.playAnimation({ key: 'idle' });
});
```

## Options

| Field | Purpose |
| --- | --- |
| `models` | Model file paths merged into the actor group |
| `animations` | `{ key, path }` entries registered with the animation delegate |
| `collisionShape` | `'capsule'`, `'bounds'`, `'trimesh'`, or `'model'` ([CollisionShapeType](/docs/api/entity/type-aliases/CollisionShapeType)) |
| `scale` | Uniform or per-axis scale applied before collider fit |
| `static` | When true, collider is fixed in the world |
| `stripRootMotionY` | Removes root Y translation tracks for static previews (off by default) |
| `material` | Shader / surface overrides (defaults to standard shader) |

Call [playAnimation](/docs/api/entity/classes/ZylemActor#playanimation) with a clip `key` after animations load—usually from `onSetup` or `onLoaded`.

## Collision shape selection

- **capsule** — best default for upright characters; cheap and stable.
- **bounds** — axis-aligned box from model bounds; fast props.
- **trimesh** / **model** — tighter fit for static level geometry; more expensive and better suited to non-dynamic bodies.

The loader picks collision source files from the model list; keep visible and collision meshes aligned in your DCC export.

## Variations

- Multiple animation entries can share keys; the delegate resolves clips by `key` when you call `playAnimation`.
- Actors participate in the same lifecycle and `entity.use(...)` pipeline as primitives—attach [Platformer3DBehavior](/docs/behaviors/catalog/platformer) or [FirstPersonBehavior](/docs/behaviors/catalog/first-person) when movement should drive the skeleton.
- Use `hideUntilPositioned: true` when a spawner places the actor a few frames after creation.

## Pitfalls

- **Grounding** — Mixamo-style exports often encode hip height in root motion; leave `stripRootMotionY` false unless you deliberately want to freeze vertical root tracks.
- **Async load** — large FBX files finish loading after spawn; prefer `onLoaded` for animation that must run exactly once when clips are ready.
- **Dynamic trimesh** — avoid high-density trimesh colliders on fast-moving dynamic actors; prefer capsules for players.

## API reference

- [createActor](/docs/api/entity/functions/createActor)
- [ZylemActor](/docs/api/entity/classes/ZylemActor)
- [ACTOR_TYPE](/docs/api/entity/variables/ACTOR_TYPE)
- [CollisionShapeType](/docs/api/entity/type-aliases/CollisionShapeType)
