---
title: Stages
description: createStage, stageConfig, spawners, and stage lifecycle
sidebar_position: 3
---

A **stage** is a scene plus physics world, cameras, and entities. Author with `createStage(...)`; the engine constructs a fresh internal runtime (`ZylemStage`) on each load while the outer `Stage` wrapper keeps your callbacks, pending entities, and input overrides.

## Minimal example

```ts
import { createGame, createStage, stageConfig } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';

const level = createStage(
  stageConfig({ gravity: { x: 0, y: -9.8, z: 0 }, variables: { wave: 1 } }),
  createSphere({ name: 'player' }),
).onSetup(({ me }) => {
  // `me` is the loaded ZylemStage; `stage` on the context is the durable wrapper
});

void createGame(level).start();
```

See [`website/snippets/game-and-stages/stages.ts`](../../snippets/game-and-stages/stages.ts) for spawners and `getEntityByName`.

## `createStage` arguments

`StageOptions` is a tuple: optional config object first, then any mix of:

- More config fragments (merged via stage defaults)
- `CameraWrapper` instances
- Entities, promises, or factory functions (`() => entity`)

```ts
createStage(
  { backgroundColor: '#112' },
  createCamera(/* ... */),
  createSphere(),
);
```

Use **`stageConfig({ ... })`** for a typed config bag (`StageConfigLike`).

## Stage configuration

| Field | Description |
| --- | --- |
| `inputs` | Player id → device list (merged with game input) |
| `backgroundColor` / `backgroundImage` / `backgroundShader` | Stage backdrop |
| `gravity` | Physics gravity vector |
| `variables` | Initial stage variable snapshot (see [Globals and variables](/docs/game-and-stages/globals-and-variables)) |
| `physicsRate` | Physics Hz (default `60`) |
| `assetLoaders.gltf` | GLTF options (`meshopt`, `ktx2TranscoderPath`; default transcoder path is applied automatically) |
| `defaultLighting` | When `false`, built-in lights are skipped |
| `postProcessingEffects` | Ordered post effects between scene and output |

## Adding entities

| API | When to use |
| --- | --- |
| `stage.add(entity, factory, …)` | Before load: stored in options; after load: enqueued into the live stage |
| `stage.addEntities([...])` | Batch append (also used when entities are passed to `createGame`) |

Async factories and promises are supported; the entity delegate loads them in batches and emits loading events.

## Lifecycle

Fluent methods mirror the game API:

- **`onSetup`** — runs once when the stage starts; context includes `me` (`ZylemStage`), `globals`, `inputs`, `camera`, `game`, and `stage` (wrapper)
- **`onUpdate`** — every frame with `delta` and `inputs`
- **`onDestroy`** — when the stage is unloaded

Call **`stage.start(setupContext)`** only if you are driving setup manually; normal games rely on `game.start()` / navigation to invoke setup.

## Cameras

On the wrapper:

- `addCamera(camera, name?)`
- `removeCamera(nameOrRef)`
- `setActiveCamera(nameOrRef)`
- `getCamera(name)`

## Lookup and events

- **`getEntityByName(name, type?)`** — search the loaded stage; optional entity type symbol narrows the result
- **`dispatch` / `listen`** — typed stage events (`stage:loaded`, `stage:unloaded`, `stage:variable:changed`); also forwarded to `zylemEventBus` (see [Events](/docs/game-and-stages/events))
- **`onLoading`** — subscribe to entity load progress for this stage (returns an unsubscribe function; not chainable)
- **`setInputConfiguration`** — stage-local input merge
- **`dispose`** — clear stage event listeners

## Runtime spawns

**`entitySpawner(factory)`** wraps `(x, y) => entity` so you can spawn at world coordinates or relative to a physics body:

```ts
import { entitySpawner } from '@zylem/game-lib/core';

const bullets = entitySpawner((x, y) => createSphere({ name: 'bullet', position: { x, y, z: 0 } }));
await bullets.spawn(stage, 0, 2);
await bullets.spawnRelative(player, stage, offset);
```

## Pitfalls

- The durable `Stage` survives reloads; do not cache `wrappedStage` across `load()`—use callbacks or `getCurrentStage()` from the game.
- `onLoading` must be registered separately; it does not return `this`.
- Heavy entity lists update reactive editor state in batches; managed-render entities are omitted from the published entity list.

## API reference

- [createStage](/docs/api/core/functions/createStage)
- [stageConfig](/docs/api/core/functions/stageConfig)
- [StageConfigLike](/docs/api/core/type-aliases/StageConfigLike)
- [entitySpawner](/docs/api/core/functions/entitySpawner)
- [Stage](/docs/api/core/functions/createStage)
- [LoadingEvent](/docs/api/core/type-aliases/LoadingEvent)
