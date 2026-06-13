# device

The **device** subsystem detects the runtime device profile (mobile, tablet, desktop) and provides aspect-ratio utilities used to adapt the game viewport and UI layout.

## Files

| File | Role |
|---|---|
| `aspect-ratio.ts` | `AspectRatioManager` — reads the window dimensions, computes the current aspect ratio, and fires callbacks on resize |
| `mobile.ts` | Mobile-specific detection logic (touch events, user-agent heuristics) and viewport helpers |

## How it fits in

`Game` and `Stage` use `AspectRatioManager` to keep the renderer and camera projection matrix in sync with the browser window. The `mobile.ts` helpers drive conditional rendering paths — for example, switching to virtual joystick input when a touchscreen device is detected.
