# game

The **game** directory implements the top-level `Game` object — the entry point and orchestrator for a Zylem application.

## Files

| File | Role |
|---|---|
| `game.ts` | `Game<TGlobals>` — the public class that consumers instantiate; wraps `ZylemGame` and exposes `onSetup`, `onUpdate`, `onDestroy`, global change subscriptions, and event dispatch |
| `zylem-game.ts` | `ZylemGame<TGlobals>` — the internal implementation: bootstraps the renderer, input, stage manager, and drives the main `requestAnimationFrame` loop |
| `game-config.ts` | `resolveGameConfig()` and `DeviceProfile` — reads environment / window size to select mobile vs. desktop rendering settings |
| `game-interfaces.ts` | `BaseGlobals`, `ZylemGameConfig`, `GameInputConfig` — the config type that `createGame()` accepts |
| `game-state.ts` | Valtio store for game-scoped global variables; `initGlobals`, `setGlobal`, `getGlobal`, `onGlobalChange` |
| `game-canvas.ts` | Creates and appends the `<canvas>` element; handles WebGPU feature detection |
| `game-debug.ts` | Wires the `stats.js` performance overlay when debug mode is on |
| `game-event-bus.ts` | `GameEventBus` — thin adapter that routes `zylemEventBus` events to consumers of the public `Game` API |

## How it fits in

`Game` sits at the top of the hierarchy:

```
Game
└── StageManager
    └── Stage (active)
        ├── Entity 1
        ├── Entity 2
        └── ...
```

A developer starts a game with the `createGame()` convenience factory exported from `@zylem/game-lib/core`. `Game` receives the list of top-level entities (or stages), resolves the rendering config for the current device, and hands off to `ZylemGame` which owns the RAF loop.

Global state (scores, player health, etc.) lives in `game-state.ts` and is accessible from any lifecycle callback via `context.globals`. `onGlobalChange` lets consumers react to specific key changes without polling.
