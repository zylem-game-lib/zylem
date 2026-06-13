# Zylem — Package Overview

This monorepo is managed with [pnpm workspaces](https://pnpm.io/workspaces). All packages live under `packages/`.

## Package map

```
packages/
├── game-lib/          @zylem/game-lib         Core framework library (public)
├── editor/            @zylem/editor           In-browser editor overlay (private)
├── examples/          @zylem/examples         Demo showcase app (private)
├── server/            @zylem/server           SpacetimeDB multiplayer module (private)
├── zylem-runtime/     @zylem/runtime          Rust/WASM simulation backend (private)
├── zylem-styles/      @zylem/zylem-styles     Design tokens & CSS utilities (public)
└── zylem-utilities/   @zylem/utilities        CLI + browser worker tools (private)
```

---

## `game-lib` — `@zylem/game-lib`

The heart of Zylem. Provides the entire TypeScript framework: game loop, entities, physics (Rapier), rendering (Three.js), input, behaviors, actions, camera, audio, and the optional WASM runtime bridge.

- **Public** — published to npm, consumed by end-user game projects.
- Entry points: `core`, `entity`, `behavior`, `audio`, `graphics`, `input`, `input-ui`, `events`, `actions`, `debug`, `globals`, `runtime`, `web-components`.
- See [`game-lib/README.md`](game-lib/README.md) for the getting-started guide.
- Each `src/lib/` subdirectory has its own `README.md` describing its role.

---

## `editor` — `@zylem/editor`

A Solid.js overlay panel that attaches to a running game and provides entity inspection, a console, play/pause controls, and detachable floating panels.

- **Private** — not published to npm; embedded in the `examples` app.
- Communicates with `game-lib` through the shared Valtio debug-state store.
- Exposes a `<zylem-editor>` Web Component for easy embedding.
- See [`editor/README.md`](editor/README.md).

---

## `examples` — `@zylem/examples`

A Vite SPA that showcases ~40 demo games built with `@zylem/game-lib`. Serves as both the documentation playground and an integration test suite.

- **Private** — deployed to [Render](https://render.com/) via Docker.
- Includes Playwright E2E tests (`tests/e2e/`).
- Contains the SpacetimeDB-generated TypeScript bindings for the arena and multiplayer-lobby modules.

---

## `server` — `@zylem/server`

A [SpacetimeDB](https://spacetimedb.com/) TypeScript module that provides server-authoritative multiplayer: entity transform replication, player registration, and arena combat state.

- **Private** — deployed as a SpacetimeDB module (compiled via the SpacetimeDB CLI).
- Two logical databases: `arena` (combat arena) and `multiplayer-lobby`.
- Client TypeScript bindings are generated into `examples/src/spacetimedb-generated/`.
- See [`server/README.md`](server/README.md) for deploy instructions.

---

## `zylem-runtime` — `@zylem/runtime`

An optional Rust/WASM simulation backend that moves per-entity physics bookkeeping out of the JS main thread and into a single WASM step call. Communicates with the engine via typed float buffers (input, render, summary).

- **Private** — the built `.wasm` binary is committed to the repo and imported by `@zylem/game-lib/runtime`.
- Built with `cargo build --target wasm32-unknown-unknown`.
- See [`zylem-runtime/README.md`](zylem-runtime/README.md) for the ABI contract.

---

## `zylem-styles` — `@zylem/zylem-styles`

The shared design-token system: Vanilla Extract CSS variables, atomic sprinkles utility, and pre-built global stylesheets for the editor components.

- **Public** — published to npm.
- Consumed by `@zylem/editor` and available to application code that wants to share the same visual language.
- See [`zylem-styles/README.md`](zylem-styles/README.md).

---

## `zylem-utilities` — `@zylem/utilities`

Developer tooling for the destructible-object workflow: a Node.js CLI and a browser Web Worker that pre-fracture 3D models using `three-pinata` so fragments can be instanced at runtime without per-frame cost.

- **Private** — the CLI is used in the `examples` build pipeline.
- See [`zylem-utilities/README.md`](zylem-utilities/README.md).

---

## Dependency graph (simplified)

```
game-lib  ←──────────────── examples
   ↑                            ↑
zylem-runtime (optional)     editor
zylem-styles  ←──────────── editor
zylem-utilities ←──────────── examples (worker)
server  ←── (generated bindings) ──→ examples
```

## Common tasks

```bash
# Install all dependencies
pnpm install

# Build everything
pnpm build

# Run game-lib unit tests
pnpm --filter @zylem/game-lib test

# Start examples dev server
pnpm --filter @zylem/examples dev

# Run E2E tests
cd packages/examples && pnpm exec playwright test

# Typecheck all packages
pnpm typecheck
```
