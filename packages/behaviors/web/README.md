# @zylem/behaviors-web

A small SolidJS harness for inspecting Zylem behaviors in isolation.

This is a **text-only** harness — no game runtime, no canvas, no Rapier, no
`@zylem/game-lib`. It imports FSMs and stores directly from `../src/lib`
via the Vite alias `@behaviors/*`. Edit a per-tick input field and the
harness auto-advances one tick so the snapshot reflects the new input;
use the manual Tick buttons to advance time without changing inputs
(useful for cooldown countdowns).

## Run

```bash
cd web
pnpm install
pnpm dev
```

Open the URL Vite prints (default `http://localhost:5180`).

## Coverage

Wired in v1:

- `screen-wrap` — `ScreenWrapFSM`
- `world-boundary-2d` — `WorldBoundary2DFSM` (incl. `getMovement` probe)
- `cooldown` — `cooldown-store` (`tickCooldowns`, `fire`, `reset`)

Behaviors whose descriptor systems require a Rapier `world`, the wasm
stage, or a live entity body are listed disabled in the sidebar (e.g.
`thruster`, `ricochet-2d`, `platformer-3d`, etc.). Adding them requires
either mocking the `BehaviorSystemContext` or building a minimal runtime
shim — out of scope for this harness's first cut.

## Adding a new harness

1. Create `src/harnesses/<id>.ts` exporting a `BehaviorHarness`.
2. Register it in `src/harnesses/registry.ts`.
3. Choose its `category` (`fsm`, `store`, `composite`, `runtime-required`)
   so it lands in the right sidebar group.

A harness wraps a behavior under three methods:

```ts
tick(delta, input): void;
snapshot(): Output; // any shape; a top-level `state` field is highlighted
reset(): void;
```

Optionally expose `actions` for behavior-specific imperative buttons
(`fire`, `reset`, `dispatch`, ...).

## Why a sibling instead of a sub-package

Keeping `web/` outside `src/` means:

- The published `@zylem/behaviors` ESM is unaffected (`tsup` only reads
  `src/`).
- No `pnpm-workspace.yaml` reshuffle of the library's root package.
- The harness can import library internals (FSMs, stores, `shared/`)
  directly without going through the public `dist` barrel.
