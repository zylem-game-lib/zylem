---
title: Asset loading
description: AssetManager, loaders, and cache semantics
sidebar_position: 6
---

**AssetManager** centralizes typed loading, in-flight deduplication, caching, and progress events. **LoaderAdapter** implementations (textures, glTF/FBX/OBJ, audio, files, JSON) produce typed results; model adapters clone assets through **CloneModelObject**. Scenes, materials, entity loaders, and runtime clients all route requests through the same service.

```mermaid
classDiagram
  direction LR

  namespace Consumers {
    class ZylemScene
    class MaterialBuilder
    class EntityAssetLoader
    class EntityLoaders
    class RuntimeClients
  }

  namespace CoreService {
    class AssetManager
    class AssetCache
    class InFlightRequests
    class AssetLoadingEvents
  }

  namespace Contracts {
    class LoaderAdapter
    class AssetType
    class BatchItem
    class BatchProgressEvent
    class ModelLoadResult
    class AudioLoadResult
    class FileLoadResult
  }

  namespace Adapters {
    class TextureLoaderAdapter
    class GLTFLoaderAdapter
    class FBXLoaderAdapter
    class OBJLoaderAdapter
    class AudioLoaderAdapter
    class FileLoaderAdapter
    class JsonLoaderAdapter
  }

  namespace Utilities {
    class CloneModelObject
  }

  ZylemScene --> AssetManager
  MaterialBuilder --> AssetManager
  EntityAssetLoader --> AssetManager
  EntityLoaders --> EntityAssetLoader
  RuntimeClients --> AssetManager
  AssetManager --> AssetCache
  AssetManager --> InFlightRequests
  AssetManager --> AssetLoadingEvents
  AssetManager --> LoaderAdapter
  AssetManager ..> AssetType
  AssetManager ..> BatchItem
  AssetManager ..> BatchProgressEvent
  AssetManager ..> ModelLoadResult
  AssetManager ..> AudioLoadResult
  AssetManager ..> FileLoadResult
  TextureLoaderAdapter ..|> LoaderAdapter
  GLTFLoaderAdapter ..|> LoaderAdapter
  FBXLoaderAdapter ..|> LoaderAdapter
  OBJLoaderAdapter ..|> LoaderAdapter
  AudioLoaderAdapter ..|> LoaderAdapter
  FileLoaderAdapter ..|> LoaderAdapter
  JsonLoaderAdapter ..|> LoaderAdapter
  JsonLoaderAdapter --> FileLoaderAdapter
  GLTFLoaderAdapter ..> CloneModelObject
  FBXLoaderAdapter ..> CloneModelObject
  OBJLoaderAdapter ..> CloneModelObject

  note for AssetManager "Centralized loading, caching, and type-based routing."
```
