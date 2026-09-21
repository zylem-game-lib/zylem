---
title: Installation
description: Install @zylem/game-lib and its peers
sidebar_position: 1
---

Install `@zylem/game-lib` in any TypeScript or JavaScript project that targets the browser (Vite, webpack, or similar). The package is ESM-only and publishes focused entry points such as `@zylem/game-lib/core` and `@zylem/game-lib/entity`—import those subpaths instead of a root barrel.

## Install the package

```bash npm2yarn
npm install @zylem/game-lib
```

Peer dependencies are listed on the package and should be installed in your app so versions stay aligned:

| Peer | Used for |
| --- | --- |
| `three` | Rendering |
| `valtio` | Reactive game globals |
| `howler` | Audio playback |
| `nanoid` | Stable ids for entities and assets |

With npm 7+, peers are often installed automatically. If your bundler warns about missing peers, add them explicitly:

```bash npm2yarn
npm install three valtio howler nanoid
```

`@zylem/behaviors` and `@zylem/runtime` are **direct dependencies** of game-lib; you do not install them separately for a normal game.

## TypeScript and tooling

Use a recent TypeScript (5.x or newer) with `"moduleResolution": "bundler"` or `"node16"` / `"nodenext"`, and `"module": "ESNext"`. Enable `"strict": true` if you can—game-lib’s types assume it.

For a minimal Vite app:

```bash npm2yarn
npm create vite@latest my-zylem-game -- --template vanilla-ts
cd my-zylem-game
npm install @zylem/game-lib three valtio howler nanoid
```

Then follow [Project setup](/docs/getting-started/project-setup) to wire an HTML mount point and call `createGame(...).start()`.

## Monorepo development

If you are hacking on Zylem itself, clone the [zylem monorepo](https://github.com/zylem-game-lib/zylem), run `pnpm install`, and use `pnpm build:lib` / `pnpm dev:lib` to build `@zylem/game-lib` from `packages/game-lib`. Cross-repo linking for the editor and examples is handled by the `zw` workspace tool in the sibling [zylem-workspace](https://github.com/zylem-game-lib/zylem-workspace) repository—not required for consuming the published npm package.

## Pitfalls

- **Root import** — `import … from '@zylem/game-lib'` is not a supported public entry. Always use subpaths like `@zylem/game-lib/core`.
- **SSR** — The engine expects `document`, WebGL, and WASM in the browser. Do not call `start()` during server-side rendering; load the game from a client-only entry.
- **Alpha APIs** — Breaking changes are still possible. Pin a semver range you are comfortable upgrading.

## API reference

- [Package exports](/docs/api) — module index generated from `@zylem/game-lib` entry points.
- [createGame](/docs/api/core/functions/createGame) — start building after install.
