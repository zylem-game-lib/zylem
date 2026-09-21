---
title: Entities
description: GameEntity model, factories, and runtime collaborators
sidebar_position: 7
---

**GameEntity** extends **BaseNode** as the gameplay composition root: mesh/group state, physics descriptors and live bodies, **use(descriptor)** behavior refs, **runAction** / **action**, and **TransformState** for motion intent. Factories (**createEntity**, **EntityBuilder**, **EntityFactory**, primitives, **ZylemActor**) build meshes and colliders; **StageEntityDelegate** and **ZylemWorld** activate entities on the stage.

```mermaid
classDiagram
  direction LR

  namespace Foundation {
    class BaseNode
    class GameEntityLifeCycle
    class MoveableEntity
    class RotatableEntityAPI
  }

  namespace EntityModel {
    class GameEntity
    class EntityDebugInfo
    class CollisionHandlerDelegate
  }

  BaseNode <|-- GameEntity
  GameEntityLifeCycle <|.. GameEntity
  MoveableEntity <|.. GameEntity
  RotatableEntityAPI <|.. GameEntity
  EntityDebugInfo <|.. GameEntity

  namespace Builders {
    class CreateEntity
    class EntityBuilder
    class EntityMeshBuilder
    class EntityCollisionBuilder
    class EntityFactory
    class CreateEntityFactory
    class EntityBlueprint
  }

  CreateEntity --> EntityBuilder
  EntityBuilder --> EntityMeshBuilder
  EntityBuilder --> EntityCollisionBuilder
  EntityFactory --> EntityBlueprint
  EntityFactory --> GameEntity
  CreateEntityFactory --> GameEntity

  namespace Parts {
    class CollisionComponent
    class BehaviorDescriptor
    class BehaviorRef
    class Action
    class TransformState
    class AssetManager
  }

  GameEntity --> CollisionComponent
  GameEntity --> BehaviorRef
  BehaviorRef --> BehaviorDescriptor
  GameEntity --> Action
  GameEntity --> TransformState
  Action --> TransformState

  namespace Families {
    class ZylemBox
    class ZylemSphere
    class ZylemActor
    class ZylemZone
    class ZylemParticleSystem
    class PrimitiveFactories
  }

  GameEntity <|-- ZylemBox
  GameEntity <|-- ZylemSphere
  GameEntity <|-- ZylemActor
  GameEntity <|-- ZylemZone
  GameEntity <|-- ZylemParticleSystem
  PrimitiveFactories --> ZylemBox
  PrimitiveFactories --> ZylemSphere
  ZylemActor --> AssetManager
  ZylemZone ..|> CollisionHandlerDelegate

  namespace Runtime {
    class StageEntityDelegate
    class ZylemStage
    class ZylemWorld
    class BehaviorSystem
  }

  ZylemStage --> StageEntityDelegate
  StageEntityDelegate --> BaseNode
  StageEntityDelegate --> GameEntity
  StageEntityDelegate --> BehaviorSystem
  BehaviorSystem --> GameEntity
  ZylemWorld --> GameEntity
  ZylemWorld --> CollisionHandlerDelegate

  note for GameEntity "Visuals, physics, composition, actions, transform intent.\nbehaviorRefs from use(...); legacy behaviors[] may also exist."
```
