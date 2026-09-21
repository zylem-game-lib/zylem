---
title: Input
description: InputManager, providers, and normalized gamepad state
sidebar_position: 12
---

**ZylemGame** owns an **InputManager** that aggregates **InputProvider** implementations (keyboard, mouse, gamepad). Raw DOM events compile into **CompiledMapping** presets (**UseArrows**, **UseWASD**, **UseMouseLook**, merged **GameInputConfig**). All devices normalize into **InputGamepad** with shared button, analog, and pointer fields for gameplay and behaviors.

```mermaid
classDiagram
  direction LR

  namespace Consumers {
    class Game
    class ZylemGame
  }

  namespace Providers {
    class InputManager
    class InputProvider
    class KeyboardProvider
    class MouseProvider
    class GamepadProvider
  }

  namespace InputState {
    class InputGamepad
    class ButtonState
    class AnalogState
    class PointerState
    class CompiledMapping
    class CompileMapping
    class CreateState
    class MergeButtons
    class MergeAnalogs
    class MergeGamepads
  }

  namespace Presets {
    class GameInputConfig
    class UseArrows
    class UseWASD
    class UseMouseLook
    class MergeConfigs
  }

  class KeyEvents
  class MouseEvents
  class BrowserGamepad

  Game --> ZylemGame
  ZylemGame --> InputManager
  InputManager o-- InputProvider
  InputProvider <|.. KeyboardProvider
  InputProvider <|.. MouseProvider
  InputProvider <|.. GamepadProvider
  InputManager --> GameInputConfig
  InputManager --> MergeGamepads
  InputManager --> InputGamepad
  KeyboardProvider --> CompiledMapping
  MouseProvider --> CompiledMapping
  KeyboardProvider --> KeyEvents
  MouseProvider --> MouseEvents
  GamepadProvider --> BrowserGamepad
  CompileMapping --> CompiledMapping
  CreateState --> ButtonState
  CreateState --> AnalogState
  MergeButtons --> ButtonState
  MergeAnalogs --> AnalogState
  MergeGamepads --> InputGamepad
  MergeGamepads ..> PointerState
  UseArrows --> GameInputConfig
  UseWASD --> GameInputConfig
  UseMouseLook --> GameInputConfig
  MergeConfigs --> GameInputConfig

  note for InputGamepad "All devices normalize into a shared controller-like shape."
```
