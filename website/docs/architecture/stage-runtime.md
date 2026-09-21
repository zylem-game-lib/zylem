---
title: Stage runtime
description: Stage wrapper, ZylemStage, and stage delegates
sidebar_position: 4
---

A **Stage** wrapper collects entities, cameras, callbacks, and config before load. **ZylemStage** is the live coordinator: it owns **ZylemScene**, **ZylemWorld**, **InstanceManager**, and focused delegates (entities, cameras, loading, models, debug). **StageEntityDelegate** spawns nodes, maps IDs, attaches physics, registers instancing, and links behavior systems—including **wasmStage** on the unified runtime when present.

```mermaid
classDiagram
  direction LR

  namespace AuthorStage {
    class Stage
    class StageConfig
    class CameraWrapper
  }

  namespace LiveStage {
    class ZylemStage
    class StageEntityDelegate
    class StageCameraDelegate
    class StageLoadingDelegate
    class StageEntityModelDelegate
    class StageDebugDelegate
  }

  namespace ScenePhysicsRender {
    class ZylemScene
    class ZylemWorld
    class CameraManager
    class RendererManager
    class InstanceManager
    class WasmStageRuntime
  }

  namespace Content {
    class BaseNode
    class GameEntity
    class BehaviorSystem
  }

  namespace Events {
    class GameEventBus
  }

  BaseNode <|-- GameEntity

  Stage --> StageConfig : parses options
  Stage --> CameraWrapper : add / activate
  Stage *-- ZylemStage : creates at load

  ZylemStage *-- StageEntityDelegate
  ZylemStage *-- StageCameraDelegate
  ZylemStage *-- StageLoadingDelegate
  ZylemStage *-- StageEntityModelDelegate
  ZylemStage *-- StageDebugDelegate
  ZylemStage *-- ZylemScene
  ZylemStage *-- ZylemWorld
  ZylemStage *-- InstanceManager
  ZylemStage o-- CameraManager
  ZylemStage --> WasmStageRuntime : optional unified runtime

  StageCameraDelegate --> CameraManager
  CameraWrapper --> CameraManager
  CameraManager --> RendererManager

  StageEntityDelegate --> BaseNode : spawns / tracks
  StageEntityDelegate --> GameEntity : physics + models
  StageEntityDelegate --> BehaviorSystem : per behavior key
  StageEntityDelegate --> WasmStageRuntime : wasmStage handle

  StageEntityModelDelegate --> StageEntityDelegate
  StageLoadingDelegate --> GameEventBus
  StageDebugDelegate --> ZylemScene
  StageDebugDelegate --> CameraManager
  ZylemWorld --> GameEntity : sync + collisions
  InstanceManager --> GameEntity
  InstanceManager --> ZylemScene

  note for Stage "Author-facing wrapper before live runtime exists."
  note for ZylemStage "Owns scene, physics, delegates, update + teardown."
  note for StageEntityDelegate "Central entity manager: spawn, UUID/EID,\nphysics attach, instancing, behavior registration."
```
