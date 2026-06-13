# runtime

The **runtime** directory integrates the optional Rust/WASM simulation backend (`@zylem/zylem-runtime`) with the TypeScript game-lib engine.

## Files

| File | Role |
|---|---|
| `zylem-wasm-runtime.ts` | `ZylemWasmRuntime` — loads the `.wasm` binary, exposes the buffer-based ABI (`inputPtr`, `renderPtr`, `summaryPtr`), and drives `zylem_runtime_step` each frame |
| `zylem-stage-runtime.ts` | `ZylemRuntimeStageAdapter` — adapts the raw WASM ABI to the `Stage` lifecycle; maps Zylem entities to WASM slots and pushes/reads per-frame buffer data |
| `wasm-stage-runtime.ts` | Higher-level helpers that wrap `ZylemRuntimeStageAdapter` for common patterns (instanced batch sessions, 2D gameplay sessions) |
| `runtime-debug-binding.ts` | Optional debug overlay that reads the WASM summary buffer and renders stats (active entities, contacts, heat) to a HUD element |

## How it fits in

The WASM runtime is **opt-in**. Games that don't need it skip this directory entirely and use the standard TypeScript physics pipeline (Rapier via JS bindings). When a game opts in, the stage replaces its per-entity Rapier step with a single `ZylemWasmRuntime.step()` call; entity transforms are then read back from the render buffer and applied in bulk, which significantly reduces per-frame GC pressure at high entity counts.

The buffer contract (strides, layout) is documented in `@zylem/zylem-runtime`'s README.
