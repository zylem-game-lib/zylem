---
title: Rendering and export
description: Offline renderSong and WAV encoding
sidebar_position: 3
---

You can bounce a `SongDefinition` to PCM faster than real time, then encode a WAV file for download or packaging. Offline rendering uses Tone.js’s `Offline` context via `renderSong`; it calls `loadTone()` but **does not** require `ensureAudio()` or a user gesture—offline contexts are not subject to autoplay rules.

## Render to AudioBuffer

```typescript
import { renderSong, type SongDefinition } from '@zylem/game-lib/audio';

const buffer = await renderSong(mySong, {
  tail: 2,           // seconds after the last note for reverb/release
  sampleRate: 44100,
  resolveUrl: (url) => `/assets/${url}`,
  trackIds: ['drums', 'bass'], // optional subset; ignores mute/solo on those tracks
});
```

`renderSong`:

1. Loads Tone.js on demand (same lazy import as playback).
2. Schedules notes and audio clips with `scheduleSong`.
3. Builds the instrument graph with `buildSongGraph`.
4. Returns a Web Audio `AudioBuffer`.

## Encode WAV

Pair the buffer with the lightweight encoder in the same module:

```typescript
import { encodeWav, encodeWavBlob } from '@zylem/game-lib/audio';

const bytes = encodeWav(buffer);       // ArrayBuffer (16-bit PCM RIFF)
const file = encodeWavBlob(buffer);    // Blob for download links
```

`encodeWav` accepts any `PcmSource` (channel count, sample rate, `getChannelData`), so you can wrap third-party render output without a live `AudioContext`.

## When to use offline render vs live player

| Approach | Use when |
| --- | --- |
| `createSongPlayer` | In-game music, preview in Creator, transport events |
| `renderSong` | Export assets, CI snapshots, thumbnails, server-side tooling in the browser |

Live playback still needs `ensureAudio()` on a user gesture; export does not.

## Pitfalls

- **Tail length** — default tail is 1.5 s; long reverbs may need a larger `tail` or the bounce will clip early.
- **Subset renders** — passing `trackIds` forces those tracks unmuted for the bounce even if they are muted in the definition.
- **URL resolution** — audio clips must load successfully; unresolved URLs fail the render promise.

## API reference

- [`renderSong`](/docs/api/audio/functions/renderSong), [`RenderSongOptions`](/docs/api/audio/interfaces/RenderSongOptions)
- [`encodeWav`](/docs/api/audio/functions/encodeWav), [`encodeWavBlob`](/docs/api/audio/functions/encodeWavBlob)
