---
title: Events
description: Game, stage, and entity event buses
sidebar_position: 6
---

Gameplay events flow through typed **`dispatch` / `listen`** methods on the game, stage, and entities, and through the shared **`zylemEventBus`** for cross-cutting subscribers (UI overlays, analytics, editor-adjacent tools).

Editor configuration and entity snapshots use **`@zylem/bridge`**, not this bus—keep gameplay listeners on the APIs below.

## Event maps

Defined in `@zylem/game-lib/events`:

### Game events (`GameEvents`)

| Event | Payload highlights |
| --- | --- |
| `loading:start` | Load began; optional `stageName`, `stageIndex` |
| `loading:progress` | `message`, `progress`, `current`, `total` |
| `loading:complete` | Load finished |
| `paused` | `{ paused: boolean }` |
| `debug` | `{ enabled: boolean }` |

### Stage events (`StageEvents`)

| Event | Payload |
| --- | --- |
| `stage:loaded` | `{ stageId }` |
| `stage:unloaded` | `{ stageId }` |
| `stage:variable:changed` | `{ key, value }` |

### Entity events (`EntityEvents`)

| Event | When |
| --- | --- |
| `entity:spawned` | Entity entered the stage |
| `entity:destroyed` | Entity removed |
| `entity:collision` | Collision pair ids |
| `entity:model:loading` | GLTF fetch started |
| `entity:model:loaded` | Model ready or failed |
| `entity:animation:loaded` | Clips ready on an actor |

Actors emit model/animation events during asset load; other types may dispatch gameplay events manually via **`entity.dispatch`**.

## Scopes

```ts
import { createGame, createStage } from '@zylem/game-lib/core';
import { zylemEventBus } from '@zylem/game-lib/events';

// Global bus
const off = zylemEventBus.on('loading:progress', (payload) => {
  console.log(payload.message);
});

// Game instance (also mirrors to the bus for game events)
const game = createGame(createStage());
const offGame = game.listen('loading:start', (payload) => {
  console.log(payload.stageName);
});

// Stage wrapper
const stage = createStage();
stage.listen('stage:loaded', ({ stageId }) => console.log(stageId));

// Entity
ball.listen('entity:model:loaded', ({ success }) => console.log(success));
```

`dispatch` on game, stage, or entity emits locally **and** on **`zylemEventBus`** for the same event name.

Sample: [`website/snippets/game-and-stages/events.ts`](../../snippets/game-and-stages/events.ts).

## DOM stage state (optional)

For non-valtio consumers, `@zylem/game-lib/core` exports:

- **`initStageStateDispatcher()`** — listens to reactive stage state and emits `STAGE_STATE_CHANGE` on `window`
- **`dispatchStageState()`** — push the current snapshot manually

Payload shape: `{ entities, variables }` (`StageStateChangeEvent`).

## Pitfalls

- **`listen`** returns an unsubscribe function; call it (or `dispose` / `disposeEvents`) to avoid leaks when hot-swapping UI.
- Loading events on the game use **`GameLoadingEvent`** (`@zylem/game-lib/core`); stage **`onLoading`** uses the slimmer **`LoadingEvent`** without guaranteed stage metadata until wired through the game delegate.
- Not every typed stage event is emitted automatically yet—use **`dispatch`** for custom stage signals you own.

## API reference

- [zylemEventBus](/docs/api/events/variables/zylemEventBus)
- [GameEvents](/docs/api/events/type-aliases/GameEvents)
- [StageEvents](/docs/api/events/type-aliases/StageEvents)
- [EntityEvents](/docs/api/events/type-aliases/EntityEvents)
- [EventEmitterDelegate](/docs/api/events/classes/EventEmitterDelegate)
- [initStageStateDispatcher](/docs/api/core/functions/initStageStateDispatcher)
