# systems

The **systems** directory contains ECS-style subsystems that operate across all entities in a stage each frame, performing bulk transform or state updates.

## Files

| File | Role |
|---|---|
| `transformable.system.ts` | `TransformableSystem` — reads velocity-intent buffers set by actions/behaviors and applies the resulting position/rotation deltas to Rapier rigid bodies |

## How it fits in

Unlike entity-level `onUpdate` callbacks which execute per-entity, systems receive the full set of active entities at once. `TransformableSystem` is invoked by `ZylemStage` after the Rapier physics step and before `nodeUpdate` callbacks run, so entity positions are authoritative by the time user code reads them.

The system pattern keeps physics-application logic in one place and avoids each entity needing to duplicate the Rapier body manipulation code.
