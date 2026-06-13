# collision

The **collision** subsystem builds Rapier physics collider descriptors, manages collision group IDs, and exposes the world-level collision listener that routes contact events to entity callbacks.

## Files

| File | Role |
|---|---|
| `collision-builder.ts` | `CollisionBuilder` — fluent builder that produces a `ColliderDesc` for an entity shape (box, sphere, capsule, mesh, etc.) |
| `runtime-collision-builder.ts` | Variant of the collision builder that works with the WASM runtime; serializes shapes instead of constructing Rapier objects directly |
| `world.ts` | `CollisionWorld` — wraps the Rapier event queue; each frame it drains contact-start/end events and invokes the matching entity `onCollide` / `onSensor` callbacks |

## How it fits in

Every entity that participates in physics holds a `ColliderDesc` produced by a `CollisionBuilder`. When the entity is added to a stage, the stage's `PhysicsDelegate` calls `world.createCollider(colliderDesc, rigidBody)` to register the shape with Rapier. Frame-to-frame collision events flow:

```
Rapier step → EventQueue → CollisionWorld.drain() → entity.onCollide(other, event)
```

Collision types are registered centrally using `getOrCreateCollisionGroupId(name)` so entities with the same type can share group-based filtering masks without manually managing bitmasks.

## Collision groups

`collision-builder.ts` exposes `getOrCreateCollisionGroupId(typeName)` which auto-assigns a bit position (0–31) to each unique collision type string. Entities with the same type can be filtered in or out of collisions by passing their type name to the builder's `withMembership` / `withFilter` helpers.
