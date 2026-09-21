---
title: Overview
description: End-to-end architecture map across major subsystems
sidebar_position: 1
---

Zylem **game-lib** is organized as published subpath barrels (`src/api`) over implementation modules (`src/lib`), with **game** and **stage** wrappers driving live runtimes (`ZylemGame`, `ZylemStage`). Entities compose behaviors and actions on a shared transform buffer; rendering and input sit on the game loop; physics uses Rapier (TypeScript `ZylemWorld` and/or unified **WasmStageRuntime**). The editor talks to a running game through **GameBridge**; cutscenes use the cinematics stack on top of the camera pipeline.

```mermaid
classDiagram
  direction LR

  namespace PublicAPI {
    class ApiCore
    class ApiEntity
    class ApiActions
    class ApiBehavior
    class ApiBridge
    class ApiCinematics
    class ApiWebComponents
  }

  namespace WebHost {
    class WebComponent
  }

  namespace GameAndStageRuntime {
    class Game
    class ZylemGame
    class Stage
    class ZylemStage
    class GameState
    class StageState
    class GameBridge
    class CutscenePreview
  }

  namespace CoreAndContent {
    class BaseNode
    class Vessel
    class GameEntity
    class AssetManager
    class Blueprints
    class BehaviorDescriptor
    class BehaviorSystem
    class Action
    class TransformStore
  }

  namespace RenderingAndInput {
    class CameraWrapper
    class ZylemCamera
    class CameraManager
    class RendererManager
    class ZylemScene
    class MaterialBuilder
    class InstanceManager
    class InputManager
  }

  namespace PhysicsAndAudio {
    class ZylemWorld
    class CollisionBuilder
    class Sounds
  }

  namespace UnifiedStageRuntime {
    class WasmStageRuntime
    class StageSimulation
    class RuntimeCollisionBuilder
  }

  namespace ExternalLibraries {
    class Three
    class Rapier
    class Bitecs
    class Valtio
    class WebAudio
    class ZylemRuntimeWasm
  }

  PublicAPI.ApiCore --> GameAndStageRuntime.Game
  PublicAPI.ApiCore --> GameAndStageRuntime.Stage
  PublicAPI.ApiEntity --> CoreAndContent.GameEntity
  PublicAPI.ApiActions --> CoreAndContent.Action
  PublicAPI.ApiBehavior --> CoreAndContent.BehaviorDescriptor
  PublicAPI.ApiBridge --> GameAndStageRuntime.GameBridge
  PublicAPI.ApiCinematics --> GameAndStageRuntime.CutscenePreview
  WebHost.WebComponent --> GameAndStageRuntime.Game
  GameAndStageRuntime.Game --> GameAndStageRuntime.ZylemGame
  GameAndStageRuntime.Game --> GameAndStageRuntime.Stage
  GameAndStageRuntime.Game --> GameAndStageRuntime.GameState
  GameAndStageRuntime.ZylemGame --> GameAndStageRuntime.GameBridge
  GameAndStageRuntime.ZylemGame --> GameAndStageRuntime.CutscenePreview
  GameAndStageRuntime.Stage --> GameAndStageRuntime.ZylemStage
  GameAndStageRuntime.Stage --> GameAndStageRuntime.StageState
  CoreAndContent.BaseNode <|-- CoreAndContent.Vessel
  CoreAndContent.BaseNode <|-- CoreAndContent.GameEntity
  CoreAndContent.GameEntity --> CoreAndContent.BehaviorDescriptor
  CoreAndContent.BehaviorDescriptor --> CoreAndContent.BehaviorSystem
  CoreAndContent.GameEntity --> CoreAndContent.Action
  CoreAndContent.Action --> CoreAndContent.TransformStore
  CoreAndContent.BehaviorSystem --> CoreAndContent.TransformStore
  GameAndStageRuntime.ZylemGame --> RenderingAndInput.InputManager
  GameAndStageRuntime.ZylemGame --> RenderingAndInput.RendererManager
  GameAndStageRuntime.ZylemGame --> GameAndStageRuntime.ZylemStage
  GameAndStageRuntime.ZylemStage --> RenderingAndInput.CameraManager
  GameAndStageRuntime.ZylemStage --> RenderingAndInput.ZylemScene
  GameAndStageRuntime.ZylemStage --> PhysicsAndAudio.ZylemWorld
  GameAndStageRuntime.ZylemStage --> UnifiedStageRuntime.WasmStageRuntime
  GameAndStageRuntime.ZylemStage ..> ExternalLibraries.Bitecs
  UnifiedStageRuntime.WasmStageRuntime --> UnifiedStageRuntime.StageSimulation
  UnifiedStageRuntime.WasmStageRuntime ..> ExternalLibraries.ZylemRuntimeWasm
  UnifiedStageRuntime.RuntimeCollisionBuilder --> UnifiedStageRuntime.WasmStageRuntime
  CoreAndContent.GameEntity --> UnifiedStageRuntime.WasmStageRuntime
  CoreAndContent.BehaviorSystem --> UnifiedStageRuntime.WasmStageRuntime
  RenderingAndInput.CameraManager --> RenderingAndInput.ZylemCamera
  RenderingAndInput.RendererManager --> RenderingAndInput.ZylemScene
  RenderingAndInput.InstanceManager --> CoreAndContent.GameEntity
  RenderingAndInput.MaterialBuilder --> CoreAndContent.AssetManager
  PhysicsAndAudio.CollisionBuilder --> CoreAndContent.GameEntity
  PhysicsAndAudio.ZylemWorld ..> ExternalLibraries.Rapier
  RenderingAndInput.ZylemScene ..> ExternalLibraries.Three
  RenderingAndInput.RendererManager ..> ExternalLibraries.Three
  RenderingAndInput.ZylemCamera ..> ExternalLibraries.Three
  GameAndStageRuntime.GameState ..> ExternalLibraries.Valtio
  GameAndStageRuntime.StageState ..> ExternalLibraries.Valtio
  PhysicsAndAudio.Sounds ..> ExternalLibraries.WebAudio

  note for GameAndStageRuntime.Game "Wrapper types collect configuration.\nRuntime types own the live loop."
  note for UnifiedStageRuntime.WasmStageRuntime "Unified stage runtime: ECS + Rapier (Rust)\nvia FFI; behavior systems use attach/query helpers when present."
  note for PhysicsAndAudio.ZylemWorld "Legacy TS-side Rapier path during migration;\nentities increasingly emit stage body/collider configs."
```
