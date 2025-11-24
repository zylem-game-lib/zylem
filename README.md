# Zylem Monorepo

A powerful and easy-to-use framework for creating simple 3D digital interactive applications using TypeScript.

## 📦 Packages

This is a pnpm workspace monorepo containing:

- **[@zylem/game-lib](./packages/game-lib)** - Core game engine library (published to npm)
- **[@zylem/editor](./packages/editor)** - SolidJS-based debug UI and editor
- **[@zylem/examples](./packages/examples)** - Example applications and playground
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

## 🎮 Using the Library

The `@zylem/game-lib` package can be installed in any project:

```bash
npm install @zylem/game-lib
```

### Basic Example

```typescript
import { boundary2d, createGame, makeMoveable, sphere } from '@zylem/game-lib';

// Creates a moveable sphere
const ball = makeMoveable(await sphere());

// when the ball is updated, move it based on the inputs
ball.onUpdate(({ me, inputs, delta }) => {
  const { Horizontal, Vertical } = inputs.p1.axes;
  const speed = 600 * delta;
  me.moveXY(Horizontal.value * speed, -Vertical.value * speed);
});

// add a boundary behavior to the ball
ball.addBehavior(
  boundary2d({
    boundaries: { top: 3, bottom: -3, left: -6, right: 6 },
  }),
);

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
