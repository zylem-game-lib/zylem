---
title: Frame update
description: Per-frame update and render order
sidebar_position: 14
---

Each animation frame the renderer polls **InputManager**, ticks **Game** → **ZylemStage**, steps physics and behavior systems, runs entity updates, flushes transform intent, syncs poses to visuals and instancing, updates cameras, then renders the active scene.

```mermaid
sequenceDiagram
  autonumber
  participant Renderer
  participant Input
  participant Game
  participant Stage
  participant World
  participant Entities
  participant BehaviorSystems
  participant RuntimeEntity
  participant Store
  participant Apply
  participant TransformSystem
  participant Instances
  participant Cameras
  participant ActiveCamera
  participant Scene

  Renderer->>Input: poll inputs
  Input-->>Renderer: merged state
  Renderer->>Game: tick(delta)
  Game->>Stage: update(delta, inputs)
  Stage->>World: step physics
  World->>RuntimeEntity: collision callbacks
  Stage->>BehaviorSystems: update systems
  BehaviorSystems->>RuntimeEntity: read linked entities
  BehaviorSystems->>Store: write intent
  Stage->>Entities: iterate nodes
  Entities->>RuntimeEntity: update
  RuntimeEntity->>Store: action intent
  Stage->>Apply: flush transforms
  Apply->>Store: resolve channels
  Apply->>World: mutate bodies
  Stage->>TransformSystem: sync transforms
  TransformSystem->>World: read pose
  TransformSystem->>RuntimeEntity: update mesh/group
  TransformSystem->>Instances: update matrices
  Stage->>Cameras: update camera pipeline
  Cameras->>ActiveCamera: update pose
  Game->>Renderer: render
  Renderer->>Scene: draw scene
```
