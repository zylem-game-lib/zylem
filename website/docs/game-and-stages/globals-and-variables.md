---
title: Globals and variables
description: Game globals and stage variables
sidebar_position: 5
---

Zylem separates **game globals** (shared for the whole session) from **stage variables** (scoped to a stage or any object you choose). Both support dot-path keys, reactive subscriptions, and integration with update pipelines.

## Game globals

Initialize globals in `gameConfig({ globals: { ... } })` or a config object passed to `createGame`. At runtime, use **`@zylem/game-lib/globals`**:

| Function | Purpose |
| --- | --- |
| `setGlobal(path, value)` | Write a value; emits internal game state updates |
| `getGlobal(path)` | Read by path |
| `createGlobal(path, defaultValue)` | Set only if missing |
| `getGlobals()` | Snapshot of the whole tree |
| `onGlobalChange(path, cb)` | Subscribe to one path |
| `onGlobalChanges(paths, cb)` | Subscribe when any path changes |

Subscriptions created through these helpers are cleared when the game **`dispose()`**s.

### Game-level listeners

The **`Game`** instance also exposes:

- **`onGlobalChange(path, (value, stage) => …)`**
- **`onGlobalChanges(paths, (values, stage) => …)`**

Callbacks register on **`start()`** and receive the current **`Stage`** wrapper (or `null`) so HUD code can read stage context without importing globals twice.

### Update pipelines

For entity or stage **`onUpdate`** hooks, **`@zylem/game-lib/actions`** provides change detectors that compare against the previous frame:

- `globalChange(key, callback)`
- `globalChanges(keys, callback)`

## Stage variables

Two complementary mechanisms exist:

1. **Config snapshot** — `stageConfig({ variables: { level: 1 } })` seeds `stageState.variables` when the stage loads (reactive proxy used by tooling).
2. **Object-scoped store** — `setVariable(target, path, value)` attaches data to any object (typically the durable **`Stage`** wrapper or an entity).

| Function | Purpose |
| --- | --- |
| `setVariable(target, path, value)` | Write on an object |
| `getVariable(target, path)` | Read |
| `createVariable(target, path, defaultValue)` | Initialize if absent |
| `onVariableChange` / `onVariableChanges` | Subscribe per object |
| `variableChange` / `variableChanges` | Frame diff helpers in `@zylem/game-lib/actions` |

Use the same **`Stage`** instance you pass to `createGame` as the `target` so values survive internal reloads of `ZylemStage`.

## Minimal example

```ts
import { createGame, createStage, gameConfig } from '@zylem/game-lib/core';
import {
  setGlobal,
  getGlobal,
  setVariable,
  getVariable,
} from '@zylem/game-lib/globals';

const stage = createStage({ variables: { coins: 0 } });

const game = createGame(
  gameConfig({ globals: { score: 0, lives: 3 } }),
  stage,
).onGlobalChange('score', (value) => {
  console.log('score', value);
});

void game.start().then(() => {
  setGlobal('score', 100);
  setVariable(stage, 'coins', (getVariable<number>(stage, 'coins') ?? 0) + 1);
  console.log(getGlobal<number>('score'));
});
```

Full sample: [`website/snippets/game-and-stages/globals-and-variables.ts`](../../snippets/game-and-stages/globals-and-variables.ts).

## Pitfalls

- **`start()`** resets and re-seeds globals from options; persist long-lived progress with explicit `setGlobal` after start or external storage.
- Dot paths (`'player.health'`) rely on nested objects existing; use `createGlobal` / `createVariable` for lazy initialization.
- Stage config `variables` and object-scoped variables are related but not automatically mirrored—pick one source of truth per key.
- `clearGlobalSubscriptions` is exported for advanced cases; normal games should rely on `game.dispose()`.

## API reference

- [setGlobal](/docs/api/globals/functions/setGlobal)
- [getGlobal](/docs/api/globals/functions/getGlobal)
- [createGlobal](/docs/api/globals/functions/createGlobal)
- [onGlobalChange](/docs/api/globals/functions/onGlobalChange)
- [onGlobalChanges](/docs/api/globals/functions/onGlobalChanges)
- [setVariable](/docs/api/globals/functions/setVariable)
- [getVariable](/docs/api/globals/functions/getVariable)
- [globalChange](/docs/api/globals/functions/globalChange)
- [variableChange](/docs/api/globals/functions/variableChange)
- [Game.onGlobalChange](/docs/api/core/classes/Game#onglobalchange)
