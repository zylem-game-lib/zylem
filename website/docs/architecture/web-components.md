---
title: Web components
description: Custom element hosting the game runtime
sidebar_position: 16
---

The **zylem-game** custom element attaches a shadow DOM, observes container resize, and starts **Game** / **ZylemGame** when connected or when a game instance is assigned. The runtime mounts canvas, input, and renderer; loads the active **Stage** into **ZylemStage**; forwards viewport changes into display config; optional debug toggles mutate host display state. The element hosts the engine—it does not replace it.

```mermaid
sequenceDiagram
  autonumber
  actor App
  participant Element
  participant Shadow
  participant Resize
  participant Display
  participant Game
  participant Config
  participant Stage
  participant Runtime
  participant Canvas
  participant Input
  participant Renderer
  participant RuntimeStage
  participant Cameras
  participant Scene

  App->>Element: connectedCallback()
  Element->>Shadow: attach shadow and mount DOM
  Element->>Resize: observe container
  Element->>Element: wire focus and controls
  alt game already available
    Element->>Game: start with host container
  else game supplied later
    App->>Element: set game or config
    Element->>Game: start with host container
  end
  Game->>Config: resolve game config
  Config-->>Game: normalized config
  Game->>Runtime: create runtime
  Runtime->>Canvas: mount canvas
  Runtime->>Input: create input providers
  Runtime->>Renderer: create renderer
  Game->>Stage: resolve stage
  Stage->>RuntimeStage: load stage
  RuntimeStage->>Cameras: resolve cameras
  RuntimeStage->>Scene: create scene
  RuntimeStage-->>Stage: loaded
  Runtime-->>Game: running
  Game-->>Element: started
  loop viewport changes
    Resize-->>Element: resized
    Element->>Display: update viewport state
    Element->>Game: push display runtime update
    Game->>Runtime: apply display changes
    Runtime->>Renderer: resize
  end
  opt debug interaction
    App->>Element: toggle debug
    Element->>Display: mutate debug state
  end
```
