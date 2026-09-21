---
title: Game config
description: gameConfig, input maps, and device/resolution options
sidebar_position: 2
---

Game configuration turns authoring options into a resolved `GameConfig`: DOM container, aspect ratio, internal render resolution, merged input (including optional touch controls), and the stage list. Pass a `gameConfig({ ... })` object as the first argument to `createGame`, or merge fields into a plain object in the options array.

## Minimal example

```ts
import { createGame, createStage, gameConfig } from '@zylem/game-lib/core';
import { useArrowsForAxes } from '@zylem/game-lib/input';

void createGame(
  gameConfig({
    id: 'retro-demo',
    preset: 'NES',
    resolution: '256x240',
    input: useArrowsForAxes('p1'),
    mobile: { controls: true, resolution: 'native' },
  }),
  createStage(),
).start();
```

Full sample: [`website/snippets/game-and-stages/game-config.ts`](../../snippets/game-and-stages/game-config.ts).

## `gameConfig` fields

`gameConfig` returns a plain `GameConfigLike` object; `resolveGameConfig` applies defaults when the game starts.

| Field | Description |
| --- | --- |
| `id` | Game id; also used as default `containerId` (`'zylem'`) |
| `globals` | Initial game-global key/value tree (see [Globals and variables](/docs/game-and-stages/globals-and-variables)) |
| `stages` | `Stage` instances (usually you pass stages as separate `createGame` arguments instead) |
| `debug` | Enables debug tooling on the runtime game |
| `time` | Initial elapsed time seed |
| `input` | Base `GameInputConfig`; merged with touch controls when `mobile.controls` is set |
| `aspectRatio` | Numeric ratio or `AspectRatio` key (for example `'SixteenByNine'`) |
| `preset` | Retro display preset (`'NES'`, `'SNES'`, …) used to derive aspect and resolution |
| `resolution` | Internal buffer: `'WxH'`, `{ width, height }`, retro preset name, or `'native'` for CSS size × DPR |
| `mobile` | Overrides for mobile profile: `aspectRatio`, `preset`, `resolution`, and `controls` |
| `mobile.controls` | `true` or `DefaultTouchControlsOptions` — auto-injects virtual controls on mobile (`enabled: 'auto'`) |
| `fullscreen` | Whether the canvas layout uses fullscreen styling (default `true`) |
| `bodyBackground` | CSS background on `document.body` (default `'#000000'`) |
| `container` / `containerId` / `canvas` | Mount target; a `<main>` is created if none exists |

## Device profile resolution

At `start()`, the engine chooses desktop vs mobile settings using:

1. `setDeviceProfile` / `setDisplayRuntime` on the `Game` instance, if set
2. Otherwise `deviceProfile: 'auto'` heuristics (`isMobile`, optional viewport size)

Mobile picks `mobile.*` overrides when present, then falls back to top-level `preset`, `resolution`, and `aspectRatio`.

## Retro resolution helpers

From `@zylem/game-lib/core`:

- **`getPresetResolution(preset, key?)`** — pixel size for a named console preset
- **`getDisplayAspect(preset)`** — display aspect for a preset
- **`parseResolution(string)`** — parse `'256x240'` literals

Use these when building custom UI that lists supported resolutions.

## Pitfalls

- Multiple config objects in one `createGame(...)` call are merged; later keys win, but only the first config’s `input` is kept today—prefer a single `gameConfig` blob.
- `'native'` resolution skips internal scaling; omitting `resolution` on desktop leaves the buffer undefined so the renderer follows the viewport.
- Touch control injection only runs when `mobile.controls` is set; desktop runtimes stay dormant even if you pass `enabled: 'auto'` manually elsewhere.

## API reference

- [gameConfig](/docs/api/core/functions/gameConfig)
- [GameConfigLike](/docs/api/core/type-aliases/GameConfigLike)
- [GameDeviceConfig](/docs/api/core/type-aliases/GameDeviceConfig)
- [ResolutionInput](/docs/api/core/type-aliases/ResolutionInput)
- [DeviceProfile](/docs/api/core/type-aliases/DeviceProfile)
- [AspectRatio](/docs/api/core/variables/AspectRatio)
- [getPresetResolution](/docs/api/core/functions/getPresetResolution)
- [parseResolution](/docs/api/core/functions/parseResolution)
