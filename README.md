# Zylem Monorepo

A powerful and easy-to-use framework for creating simple 3D digital interactive applications using TypeScript.

## Demos 🎮

You can check out the latest build with demos at [https://zylem.onrender.com](https://zylem.onrender.com).

## 📦 Packages

This is a pnpm workspace monorepo containing:

- **[@zylem/game-lib](./packages/game-lib)** - Core game engine library (published to npm)
- **[@zylem/editor](./packages/editor)** - SolidJS-based debug UI and editor
- **[@zylem/examples](./packages/examples)** - Example applications and playground
- **[@zylem/styles](./packages/zylem-styles)** - Shared style package for Zylem UI builds
- **[@zylem/runtime](./packages/zylem-runtime)** - Rust runtime scaffolding for simulation and future wasm builds
- **[@zylem/spacetime-server](./packages/server)** - SpacetimeDB multiplayer server (scaffold)

## 🚀 Quick Start

### Installation

```bash
pnpm install
```

### Development

```bash
# Start the editor dev server
pnpm dev:editor

# Start the examples playground
pnpm dev:examples

# Build the game library
pnpm build:lib

# Run tests
pnpm test

# Type check all packages
pnpm typecheck

# Lint all packages
pnpm lint
```

### Render builds with Rust

If your Render deployment needs to build `@zylem/runtime`, use the root
Render-safe build script:

```bash
pnpm build:render
```

That script installs Rust with `rustup` when `cargo` is missing, adds the
`wasm32-unknown-unknown` target, then runs the normal monorepo build.

## 🎮 Using the Library

The `@zylem/game-lib` package can be installed in any project:

```bash
npm install @zylem/game-lib
```

### Basic Example

```typescript
import {
  createGame,
  createSphere,
  WorldBoundary2DBehavior,
} from '@zylem/game-lib';

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
- 🧠 **TypeScript project references** - Real-time type sharing across packages
- 🔥 **Biome** - Modern linting and formatting
- 📦 **tsup** - Fast library bundling
- 🎨 **SolidJS + Valtio** - Reactive editor UI with shared state

### Why Monorepo?

- ✅ Zero version drift between packages
- ✅ Instant type updates across editor and library
- ✅ Unified development environment
- ✅ No constant publishing during development

## 🛠️ Technology Stack

- **Rendering**: ThreeJS [ThreeJS](https://threejs.org/)
- **Physics**: RapierRS [RapierRS](https://rapier.rs/)
- **State Management**: Valtio [Valtio](https://valtio.dev/)
- **ECS**: bitECS
- **UI Framework**: SolidJS
- **Build Tool**: Vite + tsup

## 📝 License

MIT - See [LICENSE](./LICENSE)

## 👨‍💻 Author

Tim Cool - [@tcool86](https://github.com/tcool86)

> Note: This project is still in alpha. There are unfinished features and some APIs that may change.
