# debug

The **debug** subsystem exposes lightweight helpers for tracking selected entities and paused state that the editor and in-game debug tools can read without depending on the full editor package.

## Files

| File | Role |
|---|---|
| `debug-state.ts` | Valtio proxy store with `isPaused`, `debugTool`, `hoveredEntityId`, `selectedEntityId`; read/write helpers (`setPaused`, `setDebugFlag`, etc.) |

## How it fits in

`debug-state.ts` is the single source of truth for runtime debug state that crosses package boundaries. The `@zylem/editor` package reads from this store to highlight selected entities in the scene, and `Game` reads `isPaused` each frame to gate the simulation loop. Because the state is a Valtio proxy, any consumer can `subscribe` to it for reactive updates without polling.
