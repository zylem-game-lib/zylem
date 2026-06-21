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

### npm registry authentication

The committed `.npmrc` references `${NPM_TOKEN}`:

```ini
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

Since pnpm v10.34.2 / v11.5.3, pnpm intentionally does **not** expand `${...}`
placeholders found in a repository-committed `.npmrc` (security advisory
GHSA-3qhv-2rgh-x77r), so you will see a warning like:

```
WARN Issue while reading ".npmrc". Failed to replace env in config: ${NPM_TOKEN}
```

This warning is harmless for installing public packages (no token is required to
install `@zylem/*` from the public registry). pnpm also does **not** read `.env`,
so a token defined there never reaches pnpm. Authentication is only needed to
**publish** (e.g. `pnpm publish:lib`). Provide the token from a trusted location:

- **Local (recommended fallback):** keep your personal token in your user-level
  `~/.npmrc`, which pnpm reads as a fallback automatically:

  ```ini
  //registry.npmjs.org/:_authToken=npm_xxxxxxxxxxxxxxxxxxxx
  ```

  or write it to the global config without editing any file:

  ```bash
  pnpm config set "//registry.npmjs.org/:_authToken" "$NPM_TOKEN"
  ```

  With the token present in user/global config, installs and publishes work and
  the project `.npmrc` line is simply ignored; when it is absent, public installs
  still work.

- **CI:** export the credential as a host-scoped environment variable (safe
  because the registry is encoded in the trusted variable name), or run the
  `pnpm config set` command above before installing:

  ```bash
  export "pnpm_config_//registry.npmjs.org/:_authToken=$NPM_TOKEN"
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

For the split Render Blueprint, the static examples site uses:

```bash
pnpm build:render:examples
```

That builds the Rust runtime to `.wasm` first, then bundles the examples SPA.
The SpacetimeDB API remains the separate Render web service.

### Production builds

- **`pnpm run build:production`** — Sets `NODE_ENV=production` for all JS/TS packages, disables `.map` files by default (override with `SOURCEMAP=1`), enables minify where configured, and builds `@zylem/runtime` as **wasm release only** (skips the extra debug native `cargo build` from `pnpm build`).
- **`pnpm run build:production:verify`** — Runs `scripts/ensure-spacetimedb-toolchain-ci.sh` (Rust wasm + SpacetimeDB CLI when missing), then `typecheck`, `lint`, and `build:production`. Use this in CI or for a full gate before release.
- For **npm publish** of `@zylem/game-lib`, `pnpm run publish:lib` builds the library with `NODE_ENV=production` first.

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
