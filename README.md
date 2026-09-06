# Zylem Monorepo

A powerful and easy-to-use framework for creating simple 3D digital interactive applications using TypeScript.

## Demos 🎮

You can check out the latest demos at [https://zylem.onrender.com](https://zylem.onrender.com) (hosted from [`zylem-examples`](https://github.com/zylem-game-lib/zylem-examples)).

## 📦 Packages

This is a pnpm workspace monorepo containing:

- **[@zylem/game-lib](./packages/game-lib)** - Core game engine library (published to npm)
- **[@zylem/bridge](./packages/bridge)** - Typed communication bridge shared by game-lib and the editor (published to npm)
- **[@zylem/utilities](./packages/zylem-utilities)** - Supporting development utilities

External packages published to npm from their own repositories:

- [@zylem/editor](https://github.com/zylem-game-lib/editor) - SolidJS-based debug UI and scene editor (consumes `@zylem/bridge` and peers on `@zylem/game-lib`)
- [@zylem/ui](https://github.com/zylem-game-lib/ui) - Shared styles and Solid components
- [@zylem/runtime](https://github.com/zylem-game-lib/runtime) - Rust/wasm simulation runtime (prebuilt `zylem_runtime.wasm` + TS loader)
- [@zylem/behaviors](https://github.com/zylem-game-lib/behaviors) - Tree-shakable behavior descriptors and systems
- [@zylem/shaders](https://github.com/zylem-game-lib/shaders) - WebGPU TSL shaders and postprocessing
- [@zylem/examples](https://github.com/zylem-game-lib/zylem-examples) - Example applications, playground, and SpacetimeDB server

## 🚀 Quick Start

### Installation

```bash
pnpm install
```

### Development

```bash
# Watch-build the game library
pnpm dev:lib

# Build the game library
pnpm build:lib

# Run tests
pnpm test

# Type check all packages
pnpm typecheck

# Lint all packages
pnpm lint
```

For the editor, use the sibling [`editor`](https://github.com/zylem-game-lib/editor) repo (`pnpm dev` there boots a harness game with the editor overlaid; `zw link dev` points it at this checkout's `game-lib` and `bridge`). For demos and the multiplayer server, use [`zylem-examples`](https://github.com/zylem-game-lib/zylem-examples). For shader demos, use [`shaders`](https://github.com/zylem-game-lib/shaders).

### Interactive runner

The per-repo `pnpm zylem` runner has been replaced by `zw`, the workspace
manager in the sibling [`zylem-workspace`](../zylem-workspace) repo. It covers
every zylem repo from one place, so cross-repo package linking, builds, and
tests no longer depend on which repo you happen to be standing in:

```bash
# Dashboard across all repos
zw

# Or non-interactively
zw build --repo zylem
zw link dev
```

The `build`, `bump`, and `publish` actions still load the repo `.env` first, so
secrets like `NPM_TOKEN` are available to those commands.

### Production builds

- **`pnpm run build:production`** — Sets `NODE_ENV=production` for all JS/TS packages, disables `.map` files by default (override with `SOURCEMAP=1`), and enables minify where configured. The wasm runtime comes prebuilt from the `@zylem/runtime` npm package.
- **`pnpm run build:production:verify`** — Runs `typecheck`, `lint`, and `build:production`. Use this in CI or for a full gate before release.
- For **npm publish** of `@zylem/game-lib`, `pnpm run publish:lib` (or `pnpm run publish`) builds the library with `NODE_ENV=production` first.

> **Publishing auth:** `NPM_TOKEN` is read from the root `.env` and injected as the registry auth token only during publish. It is intentionally **not** referenced from the committed `.npmrc`, so everyday `pnpm` commands (`build`, `install`, `dev`, `test`) stay warning-free.

## 🎮 Using the Library

The `@zylem/game-lib` package can be installed in any project:

```bash
npm install @zylem/game-lib
```

### Basic Example

```typescript
import { createGame } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';
import { WorldBoundary2DBehavior } from '@zylem/game-lib/behavior';

// Creates a sphere (movement capabilities are built-in)
const ball = createSphere();

// attach boundary behavior
ball.use(WorldBoundary2DBehavior, {
  boundaries: { top: 3, bottom: -3, left: -6, right: 6 },
});

// when the ball is updated, move it based on the inputs
ball.onUpdate(({ me, inputs, delta }) => {
  const { Horizontal, Vertical } = inputs.p1.axes;
  const speed = 600 * delta;
  me.moveXY(Horizontal.value * speed, -Vertical.value * speed);
});

// start the game with the ball
createGame(ball).start();
```

## 🏗️ Monorepo Structure

- ⚡ **pnpm workspaces** - Fast dependency management with instant local linking
- 🔥 **Biome** - Modern linting and formatting
- 📦 **tsup** - Fast library bundling

### Why Monorepo?

- ✅ Zero version drift between `game-lib` and the `bridge` protocol it speaks
- ✅ Instant type updates across the library and its shared packages
- ✅ Unified development environment
- ✅ No constant publishing during development

The editor, UI kit, behaviors, and runtime live in their own repos and are
linked in for local development with `zw link dev`.

## 🛠️ Technology Stack

- **Rendering**: ThreeJS [ThreeJS](https://threejs.org/)
- **Physics**: RapierRS [RapierRS](https://rapier.rs/)
- **State Management**: Valtio [Valtio](https://valtio.dev/)
- **ECS**: bitECS
- **Build Tool**: Vite + tsup

## 📝 License

MIT - See [LICENSE](./LICENSE)

## 👨‍💻 Author

Tim Cool - [@tcool86](https://github.com/tcool86)

> Note: This project is still in alpha. There are unfinished features and some APIs that may change.
