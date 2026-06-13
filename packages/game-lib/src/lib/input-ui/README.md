# input-ui

The **input-ui** subsystem renders the on-screen virtual joystick and action buttons used on touchscreen devices. It feeds touch events into the `VirtualTouchProvider` in `../input`.

## Files

| File | Role |
|---|---|
| `index.ts` | Public barrel re-exporting the main symbols |
| `default-controls.ts` | Default button/axis layout for the virtual gamepad (positions, labels, sizes) |
| `svg-assets.ts` | Inline SVG strings for joystick and button visuals |
| `touch-themes.ts` | Theming options (colour, opacity, scale) that can be passed to the virtual gamepad |

## How it fits in

`ZylemGame` conditionally mounts the virtual gamepad when `device.isMobile()` returns `true`. The mounted overlay captures pointer events on the canvas and pushes their normalised values into `VirtualTouchProvider`, which is already registered in `InputManager`. From there, virtual input is indistinguishable from keyboard or gamepad input in the entity lifecycle context.

This package is exported separately as `@zylem/game-lib/input-ui` so desktop-only games can skip loading it.
