---
title: Core foundations
description: BaseNode, assets, blueprints, and shared contracts
sidebar_position: 5
---

**core** supplies composition primitives (**BaseNode**, **Vessel**), lifecycle hooks, **AssetManager** with loader adapters, JSON **Blueprints**, shared interfaces (**IGame**, **IStage**, **ICamera**), and vector utilities. Stages, entities, scenes, and API barrels consume these types; nothing in core depends on game or stage orchestration.

```mermaid
classDiagram
  direction LR

  namespace Composition {
    class BaseNode
    class Vessel
    class LifecycleContexts
    class LifecycleCallbacks
  }

  namespace Assets {
    class AssetManager
    class LoaderAdapter
    class LoaderAdapters
    class CloneModelObject
    class AssetEvents
  }

  namespace Schemas {
    class Blueprints
    class StageBlueprint
    class EntityBlueprint
    class IGame
    class IStage
    class ICamera
  }

  namespace Utilities {
    class VectorUtils
    class CoreIndex
  }

  namespace Consumers {
    class Game
    class Stage
    class CameraWrapper
    class GameEntity
    class StageEntityDelegate
    class StageFactory
    class StageManager
    class ZylemScene
    class MaterialBuilder
    class ApiCore
  }

  Vessel --|> BaseNode
  GameEntity --|> BaseNode
  BaseNode ..> LifecycleContexts
  BaseNode ..> LifecycleCallbacks
  AssetManager --> LoaderAdapter
  AssetManager --> LoaderAdapters
  AssetManager --> CloneModelObject
  AssetManager --> AssetEvents
  Blueprints --> StageBlueprint
  Blueprints --> EntityBlueprint
  Game ..|> IGame
  Stage ..|> IStage
  CameraWrapper ..|> ICamera
  CoreIndex --> BaseNode
  CoreIndex --> Vessel
  CoreIndex --> VectorUtils
  CoreIndex --> Blueprints
  StageEntityDelegate ..> BaseNode
  StageFactory ..> StageBlueprint
  StageManager ..> StageBlueprint
  MaterialBuilder ..> AssetManager
  ZylemScene ..> AssetManager
  ApiCore ..> CoreIndex

  note for BaseNode "Main content primitive for composition and lifecycle."
```
