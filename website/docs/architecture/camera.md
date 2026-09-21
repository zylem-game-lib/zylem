---
title: Camera
description: CameraWrapper, pipeline, and multi-camera rendering
sidebar_position: 10
---

**createCamera** returns a **CameraWrapper** facade over **ZylemCamera**, which owns the Three.js camera, targets, viewport, optional render-to-texture, and a **CameraPipeline**. Each frame the pipeline applies a **CameraPerspective**, ordered **CameraBehavior** modifiers, and transient **CameraAction** effects. **CameraManager** on the stage registers cameras and renders through **RendererManager** (RTT cameras first, then viewport cameras).

```mermaid
classDiagram
  direction LR

  namespace PublicAPI {
    class CreateCamera
    class CameraWrapper
  }

  namespace RuntimeCore {
    class ZylemCamera
    class CameraPipeline
    class CameraPerspective
    class CameraBehavior
    class CameraAction
    class CameraManager
    class CameraOrbitController
    class RendererManager
    class CameraContext
    class CameraPose
    class Viewport
  }

  namespace Perspectives {
    class ThirdPersonPerspective
    class FirstPersonPerspective
    class Fixed2DPerspective
  }

  namespace StageCollab {
    class ZylemStage
    class ZylemScene
    class StageEntity
    class CameraDebugDelegate
  }

  namespace External {
    class ThreeCamera
    class RenderTarget
  }

  CreateCamera --> CameraWrapper
  CreateCamera --> ZylemCamera
  CameraWrapper *-- ZylemCamera
  ZylemCamera *-- CameraPipeline
  ZylemCamera o-- CameraOrbitController
  ZylemCamera --> StageEntity : targets
  ZylemCamera --> ThreeCamera
  ZylemCamera --> Viewport
  ZylemCamera --> RenderTarget
  CameraPipeline --> CameraContext
  CameraPipeline --> CameraPose
  CameraPipeline --> CameraPerspective
  CameraPipeline --> CameraBehavior
  CameraPipeline --> CameraAction
  ThirdPersonPerspective ..|> CameraPerspective
  FirstPersonPerspective ..|> CameraPerspective
  Fixed2DPerspective ..|> CameraPerspective
  CameraWrapper ..> CameraPerspective
  CameraWrapper ..> CameraBehavior
  CameraWrapper ..> CameraAction
  CameraManager o-- ZylemCamera
  CameraManager --> RendererManager
  CameraManager --> ZylemScene
  ZylemStage --> CameraManager
  CameraOrbitController ..> CameraDebugDelegate
  RendererManager ..> ThreeCamera
  RendererManager ..> RenderTarget

  note for CameraWrapper "Author-facing facade from createCamera(...)."
  note for CameraPipeline "Perspective base pose, behaviors, actions, then damping."
  note for CameraManager "Multi-camera orchestration; RTT then viewport passes."
```
