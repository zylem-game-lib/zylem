---
title: Presets
description: WASD, arrows, and merging input configs
sidebar_position: 2
---

Presets are small factories that return a `GameInputConfig` fragment for one player. Pass them to `setInputConfiguration` on the game or stage, or merge several players and devices with `mergeInputConfigs`.

## Minimal example

Runnable sample: `website/snippets/input/presets.ts`.

```ts
import { useArrowsForAxes, useWASDForDirections, mergeInputConfigs } from '@zylem/game-lib/input';

const input = mergeInputConfigs(
	useArrowsForAxes('p1'),
	useWASDForDirections('p1'),
);

createGame(player).setInputConfiguration(input).start();
```

## Keyboard presets

| Preset | Maps |
| --- | --- |
| `useArrowsForAxes(player)` | Arrow keys → primary axes |
| `useArrowsForSecondaryAxes(player)` | Arrow keys → secondary axes |
| `useArrowsForDirections(player)` | Arrow keys → `directions.*` |
| `useWASDForAxes(player)` | WASD → primary axes |
| `useWASDForDirections(player)` | WASD → directions |
| `useIJKLForAxes(player)` | IJKL → primary axes (player 2 friendly) |
| `useIJKLForDirections(player)` | IJKL → directions |

Keys map to string paths such as `'axes.Left'` or `'directions.Up'`. You can author custom maps with the same shape on `GameInputPlayerConfig.key`.

## mergeInputConfigs

- Merges per-player sections; both configs apply when they target different keys.
- On key conflicts, **later** configs win.
- Mouse and touch sections deep-merge `mapping`, joystick, and button overrides.

## includeDefaults

When you supply `key` mappings, player 1 keeps the default keyboard base unless you set `includeDefaults: false` on that player config. Use `includeDefaults: false` for a clean slate, then add presets like `useArrowsForDirections` so arrows still work.

## Pitfalls

- Presets only affect keyboard/mouse/touch providers you configure; gamepads are always merged separately.
- Mapping paths must match the compiled property paths (`buttons.A`, `axes.Up`, …). Typos fail silently at runtime with no input.

## API reference

- [useWASDForAxes](/docs/api/input/functions/useWASDForAxes)
- [useArrowsForDirections](/docs/api/input/functions/useArrowsForDirections)
- [mergeInputConfigs](/docs/api/input/functions/mergeInputConfigs)
- [useMouseLook](/docs/api/input/functions/useMouseLook)
- [useVirtualControls](/docs/api/input/functions/useVirtualControls)
