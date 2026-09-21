---
title: Asset loading
description: Loaders, caching, and stage integration
sidebar_position: 1
---

All runtime fetching for textures, models, audio, files, and JSON goes through a singleton **AssetManager** inside game-lib. Loader adapters under `src/lib/core/loaders/` wrap Three.js and browser APIs; stages call into the manager when backgrounds, GLTF configs, or entities need assets.

You typically configure loading via stage options and blueprints rather than importing the manager directly (it is not part of the public `@zylem/game-lib/core` export surface).

## Loader adapters

| Adapter | Formats / role |
| --- | --- |
| `TextureLoaderAdapter` | Images; optional repeat, wrap, anisotropy, clone for per-instance UV settings |
| `GLTFLoaderAdapter` | `.gltf` / `.glb`; Draco, KTX2, Meshopt when configured |
| `FBXLoaderAdapter` | `.fbx` |
| `OBJLoaderAdapter` | `.obj` |
| `AudioLoaderAdapter` | mp3, ogg, wav, flac, aac, m4a → `AudioBuffer` |
| `FileLoaderAdapter` | Raw text or `ArrayBuffer` |
| `JsonLoaderAdapter` | JSON parse |

GLTF loading supports async fetch + `parseAsync`, Draco decoders (default Google CDN path), optional KTX2 transcoder path, and meshopt when enabled. Stages call `assetManager.prepareGLTFRuntime` / `configureGLTFRuntime` from stage config (`StageGLTFAssetLoaderConfigSchema`) so compressed assets decode correctly.

## Caching and batch behavior

AssetManager features:

- URL-keyed caches per asset type with in-flight deduplication
- `loadTexture`, `loadGLTF`, `loadFBX`, `loadOBJ`, `loadAudio`, `loadFile`, `loadJSON`, and batch APIs
- Clone hooks for textures and models when callers need independent instances
- Three.js `Cache.enabled` plus optional `forceReload`
- Progress via `LoadingManager` (`batch:progress` events) and per-asset `asset:loading` / `asset:loaded`

Entity model loading (`EntityAssetLoader`) is a thin wrapper that routes file paths to the same manager.

## Blueprint asset lists

`StageBlueprint` may include an `assets` string array—URLs the stage or its entities expect. Register blueprints with `StageManager.registerStaticStage`; hydration via `StageFactory.createFromBlueprint` builds entities while the renderer and materials pull from cached loads.

```typescript
import { StageManager, type StageBlueprint } from '@zylem/game-lib/core';

const level: StageBlueprint = {
  id: 'level-1',
  assets: ['/models/props.glb'],
  entities: [{ id: 'crate', type: 'box', data: { size: { x: 1, y: 1, z: 1 } } }],
};

StageManager.registerStaticStage(level.id, level);
```

## Pitfalls

- **GLTF runtime prep** — KTX2 / Draco need paths configured before first GLTF load on a stage.
- **Cache lifetime** — singleton cache persists for the page; use testing hooks (`AssetManager.resetInstance`) only in tests.
- **Audio vs Howler** — manager audio buffers feed Three.js spatial audio; one-shots and songs use [Howler / Tone](../audio/sound-effects.md) instead.

## API reference

- Stage config: [`StageAssetLoaderConfigSchema`](/docs/api/schema/variables/StageAssetLoaderConfigSchema), [`StageGLTFAssetLoaderConfigSchema`](/docs/api/schema/variables/StageGLTFAssetLoaderConfigSchema)
- [`StageBlueprint`](/docs/api/core/type-aliases/StageBlueprint) (via core types)
- [Blueprints and serialization](./blueprints-and-serialization.md)

See also [Architecture asset loading](../architecture/asset-loading.md) for how loading fits the engine stack.
