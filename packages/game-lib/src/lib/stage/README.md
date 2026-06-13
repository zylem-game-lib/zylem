# stage

The **stage** directory implements `Stage` — the second level of the Zylem hierarchy. A stage is one self-contained game scene (level, menu, lobby) containing entities, a camera, physics world, and its own lifecycle.

## Files

| File | Role |
|---|---|
| `stage.ts` | `Stage` — the public façade; accepts entities and lifecycle callbacks, delegates to `ZylemStage` |
| `zylem-stage.ts` | `ZylemStage` — internal implementation: initialises Rapier world, wires entities, drives the per-stage update tick |
| `stage-manager.ts` | `StageManager` — owns the ordered list of stages; handles transitions (`next`, `goto`) and persists stage state |
| `stage-factory.ts` | `createStage(options)` factory used by `Game` to construct stages from plain option objects |
| `stage-config.ts` | `createDefaultStageConfig()`, `DEFAULT_KTX2_TRANSCODER_PATH` — default renderer/physics configuration resolved at stage construction |
| `stage-state.ts` | Valtio store for per-stage variables (score, lives, etc.) with `getStageVariable` / `setStageVariable` |
| `stage-loading-delegate.ts` | Emits `STAGE_LOADING_EVENT` events during the async asset-loading phase so the game can show a progress bar |
| `stage-default.ts` | `getStageOptions()` — fills in default values for any missing stage option fields |
| `stage-entity-delegate.ts` | Manages adding / removing entities from a live stage including physics body creation and cleanup |
| `stage-entity-model-delegate.ts` | Handles 3D model loading for stage-level background geometry (e.g. level mesh) |
| `stage-debug-delegate.ts` | Renders per-entity collider wireframes and physics debug overlays when debug mode is on |

## How it fits in

`Game` creates and manages `Stage` instances through `StageManager`. When a stage becomes active, `ZylemStage` initialises the Rapier physics world and calls `nodeLoaded` on every entity (triggering async asset loading). Once loading completes, the stage enters the update loop which calls `nodeUpdate` on every entity each frame.

Stage transitions (e.g. moving from a lobby stage to a gameplay stage) are triggered via `stage.dispatch('transition', 'gameplay')`. `StageManager` handles teardown of the outgoing stage and setup of the incoming one.

## Stage-scoped variables

```ts
stage.setVariable('score', 0);
// later, in an entity callback:
const score = stage.getVariable<number>('score');
```
