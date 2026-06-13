# types

The **types** directory contains string-literal constant maps that identify entity and stage types across the engine, editor, and serialisation layers.

## Files

| File | Role |
|---|---|
| `entity-type-map.ts` | String constants for every entity type (`BOX_TYPE`, `SPHERE_TYPE`, `ACTOR_TYPE`, etc.) and the `EntityTypeMap` record that maps each constant to its constructor |
| `stage-type-map.ts` | String constants for stage types and the `StageTypeMap` record |

## How it fits in

Type constants serve as stable keys in three contexts:

1. **Collision filtering** — entities set `entity.collisionType = BOX_TYPE` so collision group bitmasks can be built by name.
2. **Editor panels** — the editor looks up the display name and icon for an entity from `EntityTypeMap`.
3. **Serialisation** — when blueprints are saved/restored, the type constant is used to re-instantiate the correct entity class.

Using string constants (rather than class references) means `EntityTypeMap` can be safely serialised to JSON and loaded in a different context (e.g. the editor's iframe or a server-side snapshot).
