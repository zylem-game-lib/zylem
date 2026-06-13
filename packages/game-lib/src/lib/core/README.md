# core

The **core** subsystem contains the foundational abstractions that every other part of `@zylem/game-lib` builds on: the scene-graph node lifecycle, asset management, entity loading, shared interfaces, and miscellaneous utilities.

## Sub-directories

### `loaders/`
File-format loaders that download and decode assets at runtime.

| File | Purpose |
|---|---|
| `audio-loader.ts` | Loads audio via Howler.js |
| `fbx-loader.ts` | Loads FBX 3D models via Three.js `FBXLoader` |
| `file-loader.ts` | Generic binary / text fetch wrapper |
| `gltf-loader.ts` | Loads GLTF/GLB models; optionally supports KTX2 compressed textures |
| `obj-loader.ts` | Loads Wavefront OBJ models |
| `texture-loader.ts` | Loads image textures |
| `model-clone.ts` | Deep-clones a loaded Three.js scene graph (skeletons, animations, materials) |
| `url-utils.ts` | Normalises asset URLs (strips search/hash, resolves relative paths) |
| `index.ts` | Re-exports all loaders |

### `three-addons/`
Vendored or lightly-patched Three.js add-ons that are not yet in the official npm package.

| File | Purpose |
|---|---|
| `Timer.ts` | High-resolution frame timer used instead of `Clock` for deterministic delta-time |

### `utility/`
Small, self-contained helpers used throughout the library.

| File | Purpose |
|---|---|
| `nodes.ts` | Helper to normalise heterogeneous entity inputs into `BaseNode[]` |
| `options-parser.ts` | Merges constructor option objects with defaults |
| `path-utils.ts` | Simple path manipulation (has-path check, etc.) |
| `strings.ts` | String utilities (camelCase → label, etc.) |
| `vector.ts` | **Legacy** Rapier-flavoured vector helpers and brand colours; prefer `../vector.ts` for new code |

## Root files

| File | Purpose |
|---|---|
| `base-node.ts` | `BaseNode` — abstract scene-graph node; provides `onSetup`, `onUpdate`, `onDestroy`, child management, and the full lifecycle execution pipeline |
| `base-node-life-cycle.ts` | Lifecycle context and callback types (`SetupContext`, `UpdateContext`, etc.) |
| `asset-manager.ts` | `AssetManager` — singleton that caches loaded assets keyed by URL |
| `asset-types.ts` | TypeScript types for asset load results |
| `blueprints.ts` | TypeBox schemas for entity property blueprints used by the editor |
| `clone-utils.ts` | Utilities for deep-cloning nodes during `Stage.clone()` |
| `entity-asset-loader.ts` | Orchestrates per-entity asset fetching and injects results into `nodeLoaded` |
| `flags.ts` | Global compile-time / runtime feature flags (e.g. `DEBUG_FLAG`) |
| `index.ts` | Public barrel — re-exports the most commonly needed core symbols |
| `interfaces.ts` | `IGame`, `IStage`, `ICamera` — the narrow interfaces passed through lifecycle contexts |
| `lifecycle-base.ts` | `LifeCycleBase` — simplified lifecycle mixin for objects that don't need a full `BaseNode` |
| `node-interface.ts` | `NodeInterface` — the minimal contract for any node in the scene graph |
| `vector.ts` | `Vec2`, `Vec3`, `normalizeVec2/3`, `toThreeVector3` — the canonical vector input normalisation helpers |
| `vessel.ts` | `Vessel` — a lightweight value-object wrapper used for serialisable game data |

## How it fits in

`BaseNode` is the root of the scene graph. Every entity (`Box`, `Sphere`, `Actor`, `Stage`, `Game`) extends `BaseNode`, which gives them the lifecycle hook chain (`nodeSetup → nodeLoaded → nodeUpdate → nodeDestroy`), child management, and lifecycle replay for clone-based blueprints.

`AssetManager` is the shared cache, ensuring each URL is only fetched once even when many entities reference the same model or texture.
