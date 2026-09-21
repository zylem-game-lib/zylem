---
title: Graphics
description: Scenes, materials, instancing, and render backends
sidebar_position: 11
---

**ZylemStage** owns a **ZylemScene** (Three.js scene, lighting, backgrounds via **MaterialBuilder** and **AssetManager**) and an **InstanceManager** for batched draws. **RendererManager** selects WebGL or WebGPU, owns the canvas renderer, and draws active **ZylemCamera** views—optionally through legacy **RenderPass** or **EffectComposer** post-processing.

```mermaid
flowchart LR
  subgraph stage["Stage / camera runtime"]
    ZylemStage
    CameraManager
    ZylemCamera
    RendererManager
  end

  subgraph graphics["src/lib/graphics"]
    ZylemScene
    MaterialBuilder
    InstanceManager
    MeshBuilder
    RenderPass
  end

  subgraph content["Content / assets"]
    GameEntity
    BodyState["Rapier body state"]
    AssetManager
  end

  subgraph three["Three.js backend"]
    ThreeScene["Three.Scene"]
    ThreeRenderer["WebGLRenderer / WebGPURenderer"]
    EffectComposer
    InstancedMesh
    ShaderMaterial
  end

  ZylemStage --> ZylemScene
  ZylemStage --> InstanceManager
  ZylemStage --> CameraManager
  CameraManager --> ZylemCamera
  CameraManager --> RendererManager
  RendererManager --> ZylemScene
  RendererManager --> ZylemCamera
  RendererManager -.-> RenderPass
  RendererManager -.-> EffectComposer
  RendererManager -.-> ThreeRenderer
  ZylemScene --> ThreeScene
  ZylemScene --> MaterialBuilder
  ZylemScene --> AssetManager
  ZylemScene --> CameraManager
  MaterialBuilder --> AssetManager
  MaterialBuilder -.-> ShaderMaterial
  MeshBuilder --> MaterialBuilder
  MeshBuilder --> GameEntity
  InstanceManager --> GameEntity
  InstanceManager --> BodyState
  InstanceManager --> ZylemScene
  InstanceManager --> InstancedMesh
  GameEntity -.-> MeshBuilder
  GameEntity -.-> MaterialBuilder
```
