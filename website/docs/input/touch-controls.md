---
title: Touch controls
description: Virtual joysticks, buttons, and input-ui themes
sidebar_position: 5
---

Virtual controls render on-screen joysticks and buttons for touch devices. They feed the same `InputGamepad` fields as physical hardware. Enable them with `useVirtualControls` from `@zylem/game-lib/input`, or the higher-level `defaultTouchControls` helper from `@zylem/game-lib/input-ui`.

## Quick setup with themes

Runnable sample: `website/snippets/input/touch-controls.ts`.

```ts
import { defaultTouchControls } from '@zylem/game-lib/input-ui';
import { mergeInputConfigs, useWASDForAxes } from '@zylem/game-lib/input';

const input = mergeInputConfigs(
	useWASDForAxes('p1'),
	defaultTouchControls('p1', {
		theme: 'lagoon',
		joysticks: 'left',
		buttons: ['A', 'B'],
	}),
);

createGame(player).setInputConfiguration(input).start();
```

`defaultTouchControls` builds a `VirtualTouchConfig` with themed SVG assets, then delegates to `useVirtualControls`. With `enabled: 'auto'` (default), the overlay only appears on touch-capable devices—safe to ship on desktop builds.

## useVirtualControls (lower level)

`useVirtualControls(player, options?)` accepts the full `VirtualTouchConfig` from game config:

- `joysticks.left` / `joysticks.right` — size, deadzone, axis assignment, custom SVG.
- `buttons.A`, … — per-slot layout, labels, and `false` to hide a slot.
- `enabled: true | false | 'auto'` — force on for desktop testing.

Joystick configs can set `horizontalAxis` / `verticalAxis` to primary or secondary analog fields and optionally `emitDirections` for digital D-pad output.

## Custom art and themes

`@zylem/game-lib/input-ui` exports:

- `touchThemes`, `resolveTouchTheme`, `resolveButtonAccent`
- Raw SVG builders: `joystickBaseSvg`, `joystickThumbSvg`, `touchButtonSvg`

Pass `override` on `defaultTouchControls` to merge a raw `VirtualTouchConfig` when you need pixel-level layout without reimplementing the provider.

## Pitfalls

- Touch controls compete for the same axes as keyboard or gamepad; disable desktop keys on mobile-only builds if that causes double movement.
- Trusted SVG strings are injected into the DOM; only use static assets from the library or your own sanitized markup.
- Multiple players need separate `defaultTouchControls('p2', …)` entries merged together.

## API reference

- [defaultTouchControls](/docs/api/input-ui/functions/defaultTouchControls)
- [useVirtualControls](/docs/api/input/functions/useVirtualControls)
- [TouchTheme](/docs/api/input-ui/interfaces/TouchTheme)
- [DefaultTouchControlsOptions](/docs/api/input-ui/interfaces/DefaultTouchControlsOptions)
