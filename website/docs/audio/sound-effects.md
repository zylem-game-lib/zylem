---
title: Sound effects
description: Howler helpers such as ricochetSound and pingPongBeep
sidebar_position: 1
---

One-shot sound effects in Zylem use two paths: tiny built-in procedural beeps (Web Audio oscillators) and file-based playback through [Howler](https://howlerjs.com/) via the re-exported `Howl` class. Neither path loads Tone.js; songs are handled separately.

## Built-in procedural SFX

`@zylem/game-lib/audio` ships two helpers used by built-in behaviors:

- `ricochetSound(frequency?, duration?)` — short sawtooth burst (default 800 Hz, 50 ms)
- `pingPongBeep(frequency?, duration?)` — square-wave beep (default 440 Hz, 100 ms)

Each call creates a fresh `AudioContext` and plays immediately. They are fine for arcade feedback tied to collisions or UI, but they do not share Howler’s pooling or sprite sheets.

```typescript
import { ricochetSound, pingPongBeep } from '@zylem/game-lib/audio';

ricochetSound();
pingPongBeep(660, 0.08);
```

## File-based SFX with Howler

Import `Howl` from the same module and point it at your asset URLs (mp3, ogg, wav, and other formats Howler supports):

```typescript
import { Howl } from '@zylem/game-lib/audio';

const jump = new Howl({ src: ['/audio/jump.wav'], volume: 0.6 });
jump.play();
```

Stage loading can also fetch audio buffers through the internal asset manager (`AudioLoaderAdapter` supports mp3, ogg, wav, flac, aac, m4a) when entities or materials reference audio URLs. That path returns Three.js `AudioBuffer` objects for spatial audio, not Howler instances.

## Pitfalls

- **Autoplay policy:** Procedural helpers and Howler both need the browser to allow audio. Tie the first `play()` to a user gesture (click, key, or touch) the same way you would for music.
- **Tone.js is separate:** Importing song APIs does not affect one-shots, but the first song player will download Tone.js on demand.
- **Volume:** Built-in helpers hard-code a low gain (~0.05). Adjust in Howler via `volume` or `Howl` options.

## API reference

- [`ricochetSound`](/docs/api/audio/functions/ricochetSound)
- [`pingPongBeep`](/docs/api/audio/functions/pingPongBeep)
- [`Howl`](/docs/api/audio/classes/Howl) (re-export from howler)

See also [Songs](./songs.md) for Tone.js playback and [Rendering and export](./rendering-and-export.md) for offline bounces.
