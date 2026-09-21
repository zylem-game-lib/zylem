---
title: Game
description: createGame, start, pause, and the frame loop
sidebar_position: 1
---

The **game** is the object returned by `createGame`. It owns the render loop, input manager, shared renderer, and the list of **stages**. Call `start()` once to resolve configuration, load the first stage, and begin requesting animation frames.

## Minimal example

See [`website/snippets/game-and-stages/game.ts`](../../snippets/game-and-stages/game.ts) for a runnable sample.

```ts
import { createGame, createStage, gameConfig } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';

const player = createSphere({ name: 'player' });
const mainStage = createStage({ backgroundColor: '#1a1a2e' }, player);

void createGame(
  gameConfig({ id: 'demo', globals: { score: 0 } }),
  mainStage,
)
  .onSetup(({ globals }) => {
    globals.score = 0;
  })
  .start();
```

## Composing `createGame` options

`createGame` accepts a variadic list (`GameOptions`):

| Argument kind | Role |
| --- | --- |
| Plain object / `gameConfig({ ... })` | Merged into game configuration (id, globals, input, resolution, stages array, and so on) |
| `createStage(...)` | Registers a stage; if none is passed, an empty stage is created automatically |
| Entities (`createSphere`, `createActor`, …) | Attached to the first stage (or the only implicit stage) |

You can use the shorthand `createGame(entity1, entity2).start()` when a single default stage is enough—see [Your first game](/docs/getting-started/your-first-game).

## Lifecycle hooks

Game-level hooks run around the active stage each frame:

- **`onSetup`** — after the first stage’s setup, with `globals`, `inputs`, and `game` on the context
- **`onUpdate`** — once per frame after the stage update
- **`onDestroy`** — when the game is torn down

Stage-level hooks live on the `Stage` instance (`onSetup`, `onUpdate`, `onDestroy`); see [Stages](/docs/game-and-stages/stages).

## Loop control

| Method | Purpose |
| --- | --- |
| `start()` | Resolve config, load the first stage, begin the loop |
| `pause()` / `resume()` | Toggle debug pause state; `resume()` also resets the internal timer |
| `step(deltaTime?)` | Advance one frame manually (testing or headless stepping) |
| `dispose()` | Stop the loop, dispose the runtime game, clear globals subscriptions and shared material cache |

The loop caps at 120 FPS and clamps large frame deltas to keep physics stable.

## Input defaults

`setInputConfiguration(...configs)` deep-merges global input presets (from `@zylem/game-lib/input`). Per-stage overrides via `stage.setInputConfiguration` are merged on top when a stage loads. Safe to call before or after `start()`.

## Display runtime overrides

After construction, you can steer how `resolveGameConfig` picks mobile vs desktop layout:

- `setDeviceProfile('auto' | 'desktop' | 'mobile')`
- `setViewportSize(width, height)`
- `setDisplayRuntime({ deviceProfile, viewportSize })`

Useful for embedding the canvas in a fixed-size panel or forcing a profile in tests.

## Other helpers

- **`getCurrentStage()`** — the durable `Stage` wrapper for the loaded stage, or `null` before start
- **`onGlobalChange` / `onGlobalChanges`** — subscribe to game globals with the current stage passed into the callback; wired when `start()` runs (see [Globals and variables](/docs/game-and-stages/globals-and-variables))
- **`onLoading`** — stage and asset load progress at game scope (see [Loading](/docs/game-and-stages/loading))
- **`experimental.getRuntime()`** — `@zylem/behaviors` simulation for the active stage’s physics world (debug/editor tooling; not a stable game API)

## Pitfalls

- Most methods require `start()` to have run; calling `nextStage` or `step` early logs a reference error.
- `createGame` re-initializes globals from options on each `start()`; use `@zylem/game-lib/globals` for runtime updates.
- `goToStage()` and `end()` exist on the type surface but are not implemented yet—use `nextStage`, `previousStage`, `reset`, or `loadStageFromId` instead.

## API reference

- [createGame](/docs/api/core/functions/createGame)
- [Game](/docs/api/core/classes/Game)
- [gameConfig](/docs/api/core/functions/gameConfig)
- [GameConfigLike](/docs/api/core/type-aliases/GameConfigLike)
- [SetupContext](/docs/api/core/interfaces/SetupContext)
- [UpdateContext](/docs/api/core/type-aliases/UpdateContext)
