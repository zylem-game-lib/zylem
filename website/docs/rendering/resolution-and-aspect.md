---
title: Resolution and aspect
description: Game config, retro presets, and AspectRatioDelegate
sidebar_position: 7
---

The **game config** controls how the canvas fits its container and whether rendering uses a fixed **internal resolution** or native viewport pixels.

## Aspect ratio

`AspectRatio` constants (`FourByThree`, `SixteenByNine`, `NineBySixteen`, `TwentyOneByNine`, `OneByOne`) or any numeric ratio flow into **GameCanvas** / **AspectRatioDelegate**.

The delegate measures the container, letterboxes to the target ratio, sets CSS canvas size, and notifies the renderer to resize — largest rect that fits while preserving aspect.

Per-device overrides live under `mobile: { aspectRatio, preset, resolution }` in game config.

## Internal resolution

`resolution` accepts:

| Form | Meaning |
| --- | --- |
| `'native'` | No internal buffer scaling — render at canvas CSS size × DPR |
| `'WxH'` string | Explicit pixel buffer (also matches retro preset keys like `'256x240'`) |
| `{ width, height }` | Explicit object form |

**preset** (`NES`, `SNES`, `PS1`, `MobilePortrait`, …) selects display aspect and default resolution tables from `game-retro-resolutions`. Preset aspect is the **intended display** aspect (letterbox target), not necessarily pixel aspect of art assets.

Example: `website/snippets/rendering/retro-game-config.ts` combines `AspectRatio.FourByThree`, `preset: 'NES'`, and `resolution: '256x240'`.

## Fullscreen and container

`fullscreen: true` centers the aspect-fitted canvas in the container. `container`, `containerId`, or `canvas` let hosts mount their own DOM.

## Pitfalls

- **Mobile profile**: `resolution` / `aspectRatio` on the root config apply to desktop; use `mobile` overrides for phone layouts.
- **Art vs buffer**: Low internal resolution upscales to the aspect box — pair with post effects for crisp pixels if desired.
- **DPR**: Native resolution follows device pixel ratio; fixed buffers do not automatically account for Retina scaling unless you size them explicitly.

## API reference

- [AspectRatio](/docs/api/core/variables/AspectRatio), [AspectRatioValue](/docs/api/core/type-aliases/AspectRatioValue)
- Game config resolution fields via [createGame](/docs/api/core/functions/createGame) options (see `GameConfigLike` in generated API)
