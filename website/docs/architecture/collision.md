---
title: Collision
description: Descriptors, world attachment, and dispatch paths
sidebar_position: 13
---

**CollisionBuilder** builds body/collider descriptors, collision groups, and filters. **StageEntityDelegate** reads entity descriptors and attaches live Rapier bodies through **ZylemWorld**. After each step, **ZylemWorld** dispatches contacts on two paths: filtered **GameEntity.onCollision** callbacks, or **CollisionHandlerDelegate** for stateful sensors such as **ZylemZone** enter/held/exit.

```mermaid
classDiagram
  direction LR

  namespace Construction {
    class CollisionBuilder
    class CollisionOptions
    class CollisionComponent
    class CollisionSelector
    class CollisionMask
    class MatchSelector
  }

  namespace EntityLayer {
    class GameEntity
    class CollisionHandlerDelegate
    class ZylemZone
  }

  namespace Stage {
    class StageEntityDelegate
  }

  namespace Physics {
    class ZylemWorld
    class RigidBodyDesc
    class ColliderDesc
    class RigidBody
    class Collider
    class RapierWorld
  }

  ZylemZone --|> GameEntity
  ZylemZone ..|> CollisionHandlerDelegate
  CollisionBuilder --> CollisionOptions
  CollisionBuilder --> CollisionComponent
  CollisionBuilder --> RigidBodyDesc
  CollisionBuilder --> ColliderDesc
  CollisionBuilder --> CollisionMask
  MatchSelector --> CollisionSelector
  MatchSelector --> CollisionMask
  GameEntity o-- RigidBodyDesc
  GameEntity o-- ColliderDesc
  GameEntity o-- RigidBody
  GameEntity o-- Collider
  GameEntity ..> MatchSelector
  StageEntityDelegate --> GameEntity
  StageEntityDelegate --> ZylemWorld
  StageEntityDelegate --> RigidBodyDesc
  StageEntityDelegate --> ColliderDesc
  ZylemWorld *-- RapierWorld
  ZylemWorld --> RigidBody
  ZylemWorld --> Collider
  ZylemWorld --> GameEntity
  ZylemWorld --> CollisionHandlerDelegate

  note for CollisionBuilder "Descriptor factory: bodies, colliders, groups, filters."
  note for ZylemWorld "Step, detect contacts, dispatch callbacks or delegates."
```
