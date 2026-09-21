---
title: Actions
description: Action modules and the transform intent pipeline
sidebar_position: 8
---

**Action** implementations (interval, persistent, composition helpers) write motion intent into each entity’s **TransformState**. **BehaviorSystem** code can write the same buffer. Each frame, **ApplyTransformChanges** flushes intent into the physics world; **TransformSystem** reads body pose back onto meshes and instanced batches.

```mermaid
classDiagram
  direction LR

  namespace EntityRuntime {
    class GameEntity
    class Action
    class BaseAction
    class TransformState
  }

  namespace ActionModules {
    class IntervalActions
    class PersistentActions
    class CompositionActions
    class TransformHelpers
  }

  namespace StageCollaborators {
    class BehaviorSystem
    class ApplyTransformChanges
    class PhysicsWorld
    class TransformSystem
  }

  BaseAction ..|> Action
  GameEntity --> Action : runs
  GameEntity --> TransformState : owns
  IntervalActions ..> Action
  PersistentActions ..> Action
  CompositionActions ..> Action
  TransformHelpers ..> TransformState
  Action ..> TransformState : writes intent
  BehaviorSystem ..> TransformState : writes intent
  ApplyTransformChanges ..> TransformState : reads
  ApplyTransformChanges --> PhysicsWorld : mutates bodies
  PhysicsWorld --> TransformSystem : body transforms
  TransformSystem --> GameEntity : sync visible pose

  note for TransformState "Frame-local buffer for motion and transform intent."
  note for ApplyTransformChanges "Flushes accumulated intent into live physics state."
```
