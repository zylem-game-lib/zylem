# Zylem Runtime

`zylem-runtime` is a Rust package in the Zylem monorepo that hosts a **Shipyard** ECS simulation behind a **batched float buffer** C ABI suitable for `wasm32-unknown-unknown`.

## Why this exists

The TypeScript engine remains the source of truth for authoring, rendering, and most orchestration. This crate moves **simulation-oriented** work (e.g. collision-derived state, styling hints) into Rust while keeping the **Rapier** rigid-body step in JavaScript: each frame, the host fills an **input buffer**, calls `zylem_runtime_step`, then reads **render** and **summary** buffers—no per-entity wasm calls in the hot loop.

## Contract: one simulation per wasm module instance

The exported functions use a **thread-local** singleton `Simulation` inside the module. Instantiate **one** `WebAssembly.Module` per logical world (or accept shared state if you reuse the same instance).

## Exported symbols (C ABI)

All pointers are relative to the wasm **linear memory** returned as export `memory`.

| Symbol | Returns | Notes |
|--------|---------|--------|
| `zylem_runtime_init(capacity, initial_active)` | `usize` | Creates storage for `capacity` entities; activates `initial_active` slots. Returns active count on success, `0` if `capacity == 0`. |
| `zylem_runtime_step(dt)` | `usize` | `dt` in seconds (clamped ≥ 0). Runs sync → collision state → render build; increments tick. Returns `active_count`. |
| `zylem_runtime_active_count()` | `usize` | Current active slots. |
| `zylem_runtime_tick_count()` | `u32` | Number of completed `step` calls. |
| `zylem_runtime_activate_next()` | `usize` | Activates one more entity if under capacity; returns new slot index or `usize::MAX` if none. |
| `zylem_runtime_input_stride()` | `usize` | Floats per input slot (9). |
| `zylem_runtime_render_stride()` | `usize` | Floats per render slot (12). |
| `zylem_runtime_summary_len()` | `usize` | Floats in summary (6). |
| `zylem_runtime_input_ptr()` | `*mut f32` | Start of input buffer. |
| `zylem_runtime_input_len()` | `usize` | Length of input buffer in **floats**. |
| `zylem_runtime_render_ptr()` | `*const f32` | Start of render buffer. |
| `zylem_runtime_render_len()` | `usize` | Length of render buffer in **floats**. |
| `zylem_runtime_summary_ptr()` | `*const f32` | Start of summary buffer. |
| `zylem_runtime_summary_buffer_len()` | `usize` | Length of summary buffer in **floats** (matches `summary_len` when initialized). |

### Input buffer layout (per slot, `input_stride` floats)

| Index | Field |
|-------|--------|
| 0–2 | Position `x, y, z` |
| 3–6 | Rotation quaternion `x, y, z, w` |
| 7 | Contact count (written as float; truncated to `u32` in Rust) |
| 8 | Speed |

### Render buffer layout (per slot, `render_stride` floats)

| Index | Field |
|-------|--------|
| 0–2 | Position |
| 3–6 | Rotation quaternion |
| 7 | Scale |
| 8–10 | RGB color |
| 11 | Heat |

### Summary buffer (`summary_len` floats)

| Index | Meaning |
|-------|---------|
| 0 | Active entity count |
| 1 | Count of entities with contacts |
| 2 | Total contacts |
| 3 | Average heat |
| 4 | Max heat |
| 5 | Max contacts |

## Commands

From the repo root:

```bash
pnpm --filter @zylem/runtime build
pnpm --filter @zylem/runtime test
pnpm --filter @zylem/runtime typecheck
```

The default **`build`** script compiles the host target and **`wasm32-unknown-unknown` release** output (the `.wasm` file examples import). Root **`pnpm build`** runs this as part of the workspace.

Install the wasm target once:

```bash
rustup target add wasm32-unknown-unknown
```

To build only native or only wasm:

```bash
pnpm --filter @zylem/runtime build:native
pnpm --filter @zylem/runtime build:wasm
```

## Next steps

- Optional: multi-world handles (`Box` pointers) if multiple simulations per module are required.
- Stage-level wiring in `@zylem/game-lib` for games that opt into the Rust path.
- Benchmark hot paths before expanding component sets.
