# entities

The **entities** directory contains every concrete game-object type in `@zylem/game-lib` along with their builder helpers, delegates, and shared factories.

## Primitive entities

Each file exposes a `create<Shape>()` factory function that returns a fully-configured `GameEntity`.

| File | Entity type |
|---|---|
| `actor.ts` | `Actor` — humanoid / animated character with skeleton support |
| `box.ts` | `Box` — rectangular cuboid (physics + mesh) |
| `cone.ts` | `Cone` — cone geometry |
| `cooldown-icon.ts` | `CooldownIcon` — HUD sprite that visualises a cooldown timer |
| `cylinder.ts` | `Cylinder` — cylindrical geometry |
| `disk.ts` | `Disk` — flat disc / coin shape |
| `fog.ts` | `ZylemFog` — volumetric fog layer applied to the scene |
| `light.ts` | `Light` — point / directional / ambient light wrapper |
| `particle-system.ts` | `ParticleSystem` — three.quarks particle emitter |
| `pill.ts` | `Pill` — capsule-shaped physics body |
| `plane.ts` | `Plane` — infinite or finite flat surface (often used as a floor) |
| `pyramid.ts` | `Pyramid` — four-sided pyramid |
| `rect.ts` | `Rect` — 2D rectangle (screen-space or world-space) |
| `sphere.ts` | `Sphere` — sphere geometry |
| `sprite.ts` | `Sprite` — billboard texture facing the camera |
| `text.ts` | `Text` — 3D text geometry via `troika-three-text` |
| `zone.ts` | `Zone` — invisible trigger volume (sensor collider only) |

## Support files

| File | Role |
|---|---|
| `entity.ts` | `GameEntity<T>` — the generic base class all primitives extend; adds physics body, collision type, `runAction`, `use` (behavior), `moveXY`, etc. |
| `common.ts` | Shared entity option types and defaults |
| `builder.ts` | Low-level builder utilities shared across entity factories |
| `create.ts` | `createEntity()` generic factory used by the public API |
| `entity-factory.ts` | Internal factory that wires options → entity → physics body |
| `destroy.ts` | Standalone `destroyEntity(entity)` helper for runtime despawning |
| `index.ts` | Public barrel re-exporting all create* factories |

## Sub-directories

### `delegates/`
Per-entity subsystem delegates; kept separate from entity classes to avoid coupling.

| File | Purpose |
|---|---|
| `animation.ts` | Drives Three.js `AnimationMixer` and clip selection |
| `debug.ts` | Adds wireframe / bounding-box overlays in debug mode |
| `loader.ts` | Orchestrates model + texture loading for entities that carry a 3D model |

### `parts/`
Low-level shape factories used by the entity builders.

| File | Purpose |
|---|---|
| `index.ts` | Re-exports `CollisionFactory` and `MeshFactory` |

## How it fits in

Entities are the primary authoring primitive. A developer creates entities at the `Stage` or `Game` level:

```ts
const box = createBox({ color: '#ff0000', size: [1, 1, 1] });
box.onUpdate(({ me, inputs }) => { /* ... */ });
createGame(box);
```

All entities extend `GameEntity`, which extends `BaseNode` (see `../core`). This gives them the full lifecycle pipeline, child management, and action/behavior systems.
