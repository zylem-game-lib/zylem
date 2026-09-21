---
title: Gamepads
description: Axes, buttons, and player slots
sidebar_position: 4
---

Physical controllers connect through the browser Gamepad API. Zylem attaches one `GamepadProvider` per local player slot; player `p1` uses gamepad index `0`, `p2` uses index `1`, up through `p8` / index `7`.

Providers merge with keyboard, mouse, and touch for the same player. If both keyboard and stick move `axes.Horizontal`, the merged state reflects both sources.

## Minimal example

Runnable sample: `website/snippets/input/gamepads.ts`.

```ts
p1.onUpdate(({ me, inputs, delta }) => {
	const pad = inputs.p1;
	me.moveXY(pad.axes.Horizontal.value * 400 * delta, -pad.axes.Vertical.value * 400 * delta);
});

p2.onUpdate(({ me, inputs, delta }) => {
	const pad = inputs.p2;
	me.moveXY(pad.axes.Horizontal.value * 400 * delta, -pad.axes.Vertical.value * 400 * delta);
});

createGame(p1, p2).start();
```

No extra config is required for standard Xbox-style layouts.

## Standard mapping

| Gamepad | `InputGamepad` field |
| --- | --- |
| Face buttons 0–3 | `buttons.A/B/X/Y` |
| Shoulders 4–5 | `buttons.L/R` |
| Triggers 6–7 | `shoulders.LTrigger/RTrigger` |
| Select / Start 8–9 | `buttons.Select/Start` |
| D-pad buttons 12–15 | `directions.Up/Down/Left/Right` |
| Axes 0–1 | `axes.Horizontal/Vertical` |
| Axes 2–3 | `axes.SecondaryHorizontal/SecondaryVertical` |

`GamepadProvider.isConnected()` tracks whether the indexed pad has fired `gamepadconnected`.

## Local multiplayer

Assign entities to `inputs.p1`, `inputs.p2`, and so on. Pair keyboard presets (`useIJKLForAxes('p2')`) with the automatic gamepad index for couch co-op.

Reconfigure keyboard and mouse at runtime with `InputManager.configure` on the internal game instance; gamepad providers persist across reconfiguration.

## Pitfalls

- Browsers require a button press before `navigator.getGamepads()` returns data—prompt players to press A once.
- Hot-plugging updates `connected` but does not remap indices; order follows connection order per spec.
- Analog dead zones are not applied inside the provider; normalize in gameplay if sticks drift.

## API reference

- [InputGamepad](/docs/api/input/interfaces/InputGamepad)
- [InputProvider](/docs/api/input/interfaces/InputProvider)
- [Inputs](/docs/api/input/type-aliases/Inputs)
