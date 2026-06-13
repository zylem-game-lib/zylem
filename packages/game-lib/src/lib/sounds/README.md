# sounds

The **sounds** directory contains built-in, procedurally-generated audio clips that ship with `@zylem/game-lib` and are ready to use without loading external assets.

## Files

| File | Role |
|---|---|
| `ricochet-sound.ts` | `ricochetSound()` — synthesised bounce / ricochet tone generated via the Web Audio API |
| `ping-pong-sound.ts` | `pingPongBeep()` — classic Pong-style beep synthesised via the Web Audio API |

## How it fits in

These sounds are exported through `@zylem/game-lib/audio` and can be played from any entity callback:

```ts
import { ricochetSound } from '@zylem/game-lib/audio';

ball.onUpdate(({ me }) => {
  if (me.justCollided) {
    ricochetSound().play();
  }
});
```

For custom audio (music, voice, sound effects from files) use the `Howler.js`-based loader in `../core/loaders/audio-loader.ts` instead.
