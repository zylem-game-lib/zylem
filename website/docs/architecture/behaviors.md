---
title: Behaviors
description: Descriptors, systems, and stage registration
sidebar_position: 9
---

Entities attach gameplay through **BehaviorDescriptor** (`use` / `defineBehavior`), stored as **BehaviorRef** entries. Each descriptor creates a stage-scoped **BehaviorSystem** (one instance per behavior key) with **BehaviorSystemContext** (ECS world, **ZylemWorld**, **LinkRegistry**). Systems read linked entities and write **TransformStore** movement intent alongside actions.

```mermaid
classDiagram
  direction LR

  namespace Attachment {
    class GameEntity
    class BehaviorRef
    class DefineBehavior
    class UseBehavior
  }

  namespace BehaviorModel {
    class BehaviorDescriptor
    class BehaviorSystem
    class BehaviorSystemContext
    class BehaviorHandle
  }

  namespace StageIntegration {
    class ZylemStage
    class StageEntityDelegate
    class LinkRegistry
    class ECSWorld
  }

  namespace Modules {
    class TopDownMovement
    class Thruster
    class FirstPerson
    class WorldBoundary2D
    class Cooldown
    class TransformStore
    class ZylemWorld
    class FirstPersonPerspective
  }

  UseBehavior --> GameEntity : attach
  UseBehavior --> BehaviorDescriptor
  DefineBehavior --> BehaviorDescriptor
  GameEntity --> BehaviorRef : stores
  BehaviorRef --> BehaviorDescriptor
  BehaviorDescriptor --> BehaviorSystem : creates
  BehaviorDescriptor --> BehaviorHandle : optional
  ZylemStage --> StageEntityDelegate
  ZylemStage --> BehaviorSystem : updates
  StageEntityDelegate --> LinkRegistry : registers refs
  LinkRegistry --> BehaviorRef
  BehaviorSystem --> BehaviorSystemContext
  BehaviorSystemContext --> ECSWorld
  BehaviorSystemContext --> ZylemWorld
  BehaviorSystemContext --> LinkRegistry
  BehaviorSystem --> TransformStore : movement intent
  TopDownMovement ..> BehaviorDescriptor
  Thruster ..> BehaviorDescriptor
  FirstPerson ..> BehaviorDescriptor
  WorldBoundary2D ..> BehaviorDescriptor
  Cooldown ..> BehaviorDescriptor
  FirstPerson ..> FirstPersonPerspective
  Thruster ..> ZylemWorld

  note for StageEntityDelegate "One behavior system per behavior key on the active stage."
```
