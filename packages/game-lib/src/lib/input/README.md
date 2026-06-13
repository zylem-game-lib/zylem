# input

The **input** subsystem normalises player input across keyboard, mouse, gamepad, and virtual touch into a single unified `Inputs` object that is injected into every lifecycle context.

## Files

| File | Role |
|---|---|
| `input.ts` | `Inputs` type and `InputManager` — the central hub that merges all provider values each frame |
| `input-manager.ts` | Creates and owns one provider per device type; calls `poll()` each frame; computes the merged `Inputs` snapshot |
| `input-state.ts` | `InputState` — the plain-data structure holding axes, buttons, and pointer coords for one player slot |
| `input-presets.ts` | `DEFAULT_INPUT_CONFIG` and `mergeInputConfigs()` — predefined key/button bindings; games can override via `game.setInputConfig()` |
| `keyboard-provider.ts` | `KeyboardProvider` — listens to `keydown`/`keyup` and maps key codes to logical axes / buttons |
| `gamepad-provider.ts` | `GamepadProvider` — polls `navigator.getGamepads()` and maps stick / button values to the unified format |
| `mouse-provider.ts` | `MouseProvider` — normalises mouse position and click state |
| `virtual-touch-provider.ts` | `VirtualTouchProvider` — translates virtual joystick / touch events (from `../input-ui`) to the same axis/button format |

## How it fits in

`InputManager` is created by `ZylemGame` and its current `Inputs` snapshot is passed as `context.inputs` to every `onUpdate` callback. All providers are polled synchronously at the start of each frame before entity updates run, so entities always see a consistent input state for the current frame.

Input presets allow a game to remap controls:

```ts
createGame({
  inputConfig: {
    p1: { keyboard: { moveLeft: ['ArrowLeft', 'KeyA'], jump: ['Space'] } },
  },
});
```

Virtual touch support is designed for mobile browsers; the `../input-ui` package renders the on-screen joystick and buttons that feed into `VirtualTouchProvider`.
