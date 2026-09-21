---
title: Game runtime
description: Game, ZylemGame, startup, and loop orchestration
sidebar_position: 3
---

Author code builds a **Game** wrapper (`createGame`) that resolves **GameConfig**, owns **GameState** and the **GameEventBus**, and controls a live **ZylemGame**. The runtime mounts the canvas, wires **InputManager** and **RendererManager**, loads **Stage** wrappers into **ZylemStage**, and coordinates loading delegates. **GameBridge** and cutscene preview hook into **ZylemGame** for editor and Director mode without replacing the engine loop.

```mermaid
classDiagram
  direction LR

  namespace AuthorFacing {
    class Game
    class Stage
    class CreateGame
  }

  namespace ConfigState {
    class ResolveGameConfig
    class GameConfig
    class GameState
    class GameEventBus
  }

  namespace LiveRuntime {
    class ZylemGame
    class GameCanvas
    class GameLoadingDelegate
    class GameRendererObserver
    class GameDebugDelegate
    class GameBridge
    class CutscenePreviewController
  }

  namespace Collaborators {
    class InputManager
    class RendererManager
    class ZylemStage
    class StageLoadingDelegate
    class CameraManager
    class ZylemScene
    class ZylemWorld
  }

  CreateGame --> Game
  Game --> ResolveGameConfig
  ResolveGameConfig --> GameConfig
  Game --> ZylemGame : controls
  Game --> Stage : accepts wrappers
  Game --> GameState
  Game --> GameEventBus
  ZylemGame --> GameConfig
  ZylemGame --> GameCanvas
  ZylemGame --> InputManager
  ZylemGame --> RendererManager
  ZylemGame --> GameLoadingDelegate
  ZylemGame --> GameRendererObserver
  ZylemGame --> GameDebugDelegate
  ZylemGame --> GameBridge
  ZylemGame --> CutscenePreviewController
  ZylemGame --> Stage : loads
  Stage --> ZylemStage : materializes runtime stage
  ZylemGame --> ZylemStage : active stage
  ZylemStage --> StageLoadingDelegate
  ZylemStage --> CameraManager
  ZylemStage --> ZylemScene
  ZylemStage --> ZylemWorld
  RendererManager --> CameraManager
  GameLoadingDelegate --> StageLoadingDelegate

  note for ZylemGame "Owns the live loop, canvas, renderer, input,\nactive stage lifecycle, bridge, and cutscene preview."
```
