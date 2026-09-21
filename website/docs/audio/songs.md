---
title: Songs
description: SongDefinition, createSongPlayer, and Tone.js on demand
sidebar_position: 2
---

Songs are JSON-serializable scores: instruments (Tone.js synth presets plus an effects chain), tracks, and clips placed in **beats** at a given BPM. Creator’s Music mode authors `.song.json` files that match the `SongDefinition` schema; at runtime you play them with `createSongPlayer`.

Tone.js is **loaded on demand** the first time you create a song player or call `renderSong`. Games that never play music never download it.

## User gesture and `ensureAudio`

Browsers block audio until the user interacts with the page. Before the first `play()`, call `ensureAudio()` from a click or key handler. It loads Tone.js (once) and starts the `AudioContext`. Later calls are cheap; use `isAudioReady()` to see whether the context is running.

```typescript
import { createSongPlayer, ensureAudio, type SongDefinition } from '@zylem/game-lib/audio';

button.addEventListener('click', async () => {
  await ensureAudio();
  const player = createSongPlayer(mySong);
  await player.ready;
  await player.play();
});
```

`loadTone()` fetches Tone without touching the context—useful for prefetching after a gesture elsewhere.

## Song shape

A `SongDefinition` includes:

| Field | Role |
| --- | --- |
| `bpm`, `timeSignature`, `lengthBars` | Tempo and grid |
| `instruments` | Synth presets, envelopes, effects |
| `tracks` | Instrument or audio lanes (mute, solo, pan, volume) |
| `clips` | Note clips (`kind: 'notes'`) or sample clips (`kind: 'audio'` with a `url`) |
| `loop`, `masterVolume` | Optional loop region and master fader (dB) |

Validate documents with `SongDefinitionSchema` from `@zylem/game-lib/audio` or the published [song schema](../assets-and-data/json-schemas.md).

## Song player

`createSongPlayer(definition, options?)` builds a Tone.js transport graph. Only **one** active player exists at a time; creating a new player disposes the previous one.

| Method / property | Purpose |
| --- | --- |
| `ready` | Resolves when Tone and audio clip URLs are loaded |
| `play(fromBeat?)`, `pause()`, `stop()`, `seek(beat)` | Transport control |
| `position()`, `seconds()` | Playhead |
| `setBpm`, `setLoop`, track mute/solo/volume/pan | Live mix |
| `preview(trackId, pitch, …)` | Audition a note on a track |
| `update(definition)` | Hot-swap the score while keeping playhead and state |
| `on('bar' \| 'beat' \| 'complete' \| 'state', …)` | Timing hooks |

Options:

- `resolveUrl(url)` — map relative asset paths before loading audio clips
- `destination` — route master output to a Tone input instead of speakers

`getActiveSongPlayer()` returns the current instance, if any.

## Scheduling helpers

`song-math` exports beat/second conversion, `scheduleSong`, `clipsAt`, MIDI helpers, and related types—useful for editors, sequencers, or custom render paths without starting the transport.

## Pitfalls

- **First `play()` without a gesture** — context may stay suspended; retry `ensureAudio()` on the next interaction.
- **Shared transport** — global Tone transport; one song at a time per page.
- **Audio clip URLs** — failed loads log a warning; playback continues for other clips.

## API reference

- [`SongDefinition`](/docs/api/audio/type-aliases/SongDefinition) and [`SongDefinitionSchema`](/docs/api/audio/variables/SongDefinitionSchema)
- [`createSongPlayer`](/docs/api/audio/functions/createSongPlayer)
- [`ensureAudio`](/docs/api/audio/functions/ensureAudio), [`loadTone`](/docs/api/audio/functions/loadTone), [`isAudioReady`](/docs/api/audio/functions/isAudioReady)
- [`scheduleSong`](/docs/api/audio/functions/scheduleSong) and related song-math exports

See [Rendering and export](./rendering-and-export.md) to bounce a song offline.
