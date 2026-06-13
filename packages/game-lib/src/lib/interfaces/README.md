# interfaces

The **interfaces** directory contains legacy structural type definitions for entity objects that are still referenced by low-level stage and physics code.

## Files

| File | Role |
|---|---|
| `entity.ts` | `Entity<T>`, `StageEntity` — structural interfaces describing the minimum contract required by stage entity management (physics body, group, mesh, collision handler); also defines the `LifecycleFunction` alias |

## How it fits in

These interfaces describe the "duck-typed" shape of an entity as seen by the stage's physics and collision code — specifically the Rapier `RigidBody`, Three.js `Group`/`Mesh`, and `KinematicCharacterController` fields that the stage delegate code accesses directly.

The higher-level `GameEntity` class (in `../entities/entity.ts`) satisfies `StageEntity`. New code should depend on `GameEntity` directly rather than `StageEntity`; these interfaces remain for backward compatibility with lower-level stage plumbing.
