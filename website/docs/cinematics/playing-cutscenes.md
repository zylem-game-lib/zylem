---
title: Playing cutscenes
description: createCutscenePlayer, hosts, and stage integration
sidebar_position: 3
---

`createCutscenePlayer(definition, options)` drives a live camera through `CutsceneCameraBehavior`, runs scene transitions on the renderer, and fires event/audio items as the playhead advances.

## Minimal setup

```typescript
import {
  createCutscenePlayer,
  createStageCutsceneHost,
  type CutsceneDefinition,
} from '@zylem/game-lib/cinematics';
import { createStage } from '@zylem/game-lib/core';

const stage = createStage({ id: 'gameplay' });
const player = createCutscenePlayer(myCutscene, {
  host: createStageCutsceneHost(stage),
});
player.on('complete', () => player.dispose());
player.play();
```

## CutsceneHost

The host abstracts everything the timeline needs from the game:

| Hook | Used for |
| --- | --- |
| `camera()` | `ZylemCamera` the behavior attaches to |
| `entityPosition(name)` | Follow cameras and dolly look-at |
| `dispatch` / `setVariable` | `emit` and `setVariable` events |
| `playAnimation` | Animation keys on named entities |
| `playSong` / `stopSong` | Song audio items (Tone.js, loaded on demand) |
| `playSfx` | SFX items (Howler) |
| `beginTransition` | Picture transitions between scenes |

`createStageCutsceneHost(stage, options?)` implements these for a running stage. Options:

- `resolveSong(ref)` — map song slugs to `SongDefinition` (required for song playback)
- `transitionShader(type)` — per-type blend shader; defaults to crossfade
- `onEvent` — extra listener for `emit` events

Register global transition shaders once:

```typescript
import { setCutsceneTransitionShaders } from '@zylem/game-lib/cinematics';
import { createStageTransition } from '@zylem/shaders';

setCutsceneTransitionShaders((type) => createStageTransition({ pattern: type }).shader);
```

## Player options and control

| Option | Default | Meaning |
| --- | --- | --- |
| `tick` | `'auto'` | `'manual'` — call `update(dt)` from your game loop so cutscenes pause with gameplay |
| `fireEventsOnSeek` | `false` | When true, scrubbing triggers crossed events (usually off for editor scrub) |
| `timeScale` | `1` | Playback speed multiplier |
| `transitionShader` | host / global | Override per player |

| Method | Behavior |
| --- | --- |
| `play(from?)`, `pause()`, `stop()` | Transport; `stop` returns camera to gameplay |
| `seek(time)` | Jump in seconds |
| `skip()` | Jump to end when `skippable` |
| `setDefinition(def)` | Live edit while keeping time and state |

Events: `time`, `state`, `scene`, `shot`, `event`, `audio`, `complete`, `skip`.

## Manual tick with the game loop

When the game is paused or you want deterministic stepping:

```typescript
const player = createCutscenePlayer(def, {
  host: createStageCutsceneHost(stage),
  tick: 'manual',
});

game.onUpdate(({ delta }) => {
  if (player.state === 'playing') player.update(delta);
});
```

## Pitfalls

- **Dispose on complete** — detach the camera behavior or call `stop()`/`dispose()` so gameplay regains the camera.
- **Songs need gesture** — first song playback still requires user activation for Tone.js (see [Songs](../audio/songs.md)).
- **Seek vs events** — default scrubbing does not fire gameplay events; enable only when intentional.

## API reference

- [`createCutscenePlayer`](/docs/api/cinematics/functions/createCutscenePlayer)
- [`CutsceneHost`](/docs/api/cinematics/interfaces/CutsceneHost)
- [`createStageCutsceneHost`](/docs/api/cinematics/functions/createStageCutsceneHost)
- [`CutsceneCameraBehavior`](/docs/api/cinematics/classes/CutsceneCameraBehavior)
