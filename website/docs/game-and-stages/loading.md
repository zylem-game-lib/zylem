---
title: Loading
description: Asset and stage loading events
sidebar_position: 7
---

Stage loads are progressive: entities spawn in batches, models fetch asynchronously, and delegates emit **`start` → `progress` → `complete`** events. Subscribe at **stage** scope for fine-grained entity progress, at **game** scope for UI that follows navigation, or on **`zylemEventBus`** for app-wide overlays.

## Event shapes

**Stage `LoadingEvent`** (`@zylem/game-lib/core`):

| Field | Description |
| --- | --- |
| `type` | `'start' \| 'progress' \| 'complete'` |
| `message` | Human-readable status |
| `progress` | `0–1` overall |
| `current` / `total` | Optional batch counters during entity load |

**Game `GameLoadingEvent`** adds:

| Field | Description |
| --- | --- |
| `stageName` | Active stage id/name when forwarded |
| `stageIndex` | Index in the game’s stage list |

The game delegate maps stage events to **`loading:start`**, **`loading:progress`**, and **`loading:complete`** on **`zylemEventBus`** with the enriched payload.

## Subscribing

```ts
import { createGame, createStage } from '@zylem/game-lib/core';
import { zylemEventBus } from '@zylem/game-lib/events';
import { createSphere } from '@zylem/game-lib/entity';

const hero = createSphere({ name: 'hero' });
const stage = createStage({}, hero);

stage.onLoading((event) => {
  if (event.type === 'progress') {
    console.log(event.message, event.current, event.total);
  }
});

const game = createGame(stage);

game.onLoading((event) => {
  console.log(event.stageName, event.type, event.progress);
});

zylemEventBus.on('loading:complete', (payload) => {
  console.log('done', payload.message);
});

void game.start();
```

Register **`game.onLoading`** before **`start()`** if you need the first stage’s earliest events—the game queues callbacks until the runtime exists, then attaches them before the initial load.

Sample: [`website/snippets/game-and-stages/loading.ts`](../../snippets/game-and-stages/loading.ts).

## What triggers progress

Inside a loaded **`ZylemStage`**, the entity delegate’s generator:

1. Emits **start** when loading begins
2. Emits **progress** as entities/materials complete (with batch counts)
3. Emits **complete** when the stage is ready for setup

Large stages yield to the event loop between batches so progress UI stays responsive. Model-heavy actors also emit entity-level **`entity:model:*`** events (see [Events](/docs/game-and-stages/events)).

## GLTF / KTX2

Stage config may set **`assetLoaders.gltf`** (`meshopt`, `ktx2TranscoderPath`). The engine applies a default KTX2 transcoder path when none is supplied so Basis textures decode on first use.

## Pitfalls

- **`stage.onLoading`** returns an unsubscribe function—it does **not** return the stage; assign the stage before registering.
- Progress ratios are stage-local; when navigating, reset UI on each `loading:start`.
- Internal **`gameEventBus`** channels (`stage:loading:*`, `game:state:updated`) are for engine wiring—not the public gameplay API; prefer **`onLoading`** and **`zylemEventBus`**.

## API reference

- [Game.onLoading](/docs/api/core/classes/Game#onloading)
- [GameLoadingEvent](/docs/api/core/interfaces/GameLoadingEvent)
- [LoadingEvent](/docs/api/core/type-aliases/LoadingEvent)
- [GameLoadingPayload](/docs/api/events/interfaces/GameLoadingPayload)
- [Stage.onLoading](/docs/api/core/functions/createStage)
