# @zylem/utilities

Monorepo utilities providing the **destructible prebake** pipeline — a tool for pre-computing mesh fracture geometry (via [`@dgreenheck/three-pinata`](https://github.com/dgreenheck/three-pinata)) so that destructible objects can be instanced at runtime without paying the fracture cost in-frame.

## Packages

### `destructible-prebake/` — CLI tool

Invoked as `zylem-destructible-prebake <model.glb> [options]`.

Loads a GLB model, fractures its meshes using `three-pinata`, and writes a `.glb` sidecar file alongside a `.json` metadata file describing the fragment count and bounding data. Consume the output in your game to create `OptimizedDestructibleShip`-style entities.

| File | Role |
|---|---|
| `src/cli.ts` | Entry point; parses CLI arguments (model path, fragment count, output dir) |
| `src/find-mesh.ts` | Traverses a loaded GLTF scene to locate the primary `Mesh` object |
| `src/sidecar-json.ts` | Writes the `.json` metadata sidecar next to the output GLB |
| `tsup.config.ts` | Bundles to `dist/cli.js` as a Node.js ESM binary |

```bash
npx zylem-destructible-prebake assets/ship.glb --fragments 32 --out dist/assets
```

### `workers/destructible-prebake/` — Browser worker

A [Comlink](https://github.com/GoogleChromeLabs/comlink)-wrapped Web Worker that runs the same fracture pipeline in the browser on a background thread.

| File | Role |
|---|---|
| `src/worker.ts` | Comlink-exposed `prebake(modelUrl, fragments)` function |
| `tsup.config.ts` | Bundles to `dist/worker.js` as a self-contained IIFE worker |

Import the worker URL in your game via the `@zylem/utilities/workers/destructible-prebake` export and spin it up when you need to prebake at runtime (e.g. during loading screens).

## How it fits in

The `optimized-destructible-ship` demo in `@zylem/examples` uses this pipeline. Models are prebaked at build time by the `repo-actions/optimize-gltf.mjs` script; the resulting assets are committed so players don't pay the fracture cost at runtime.
