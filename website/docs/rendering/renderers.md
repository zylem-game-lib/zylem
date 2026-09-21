---
title: Renderers
description: WebGL, WebGPU, and RendererManager
sidebar_position: 1
---

Zylem standardizes on Three.js **WebGPURenderer** (`ZylemRenderer`). There is one **RendererManager** per **game**; it owns the canvas-sized renderer, the animation loop, optional TSL post-processing, and stage transition blending.

## Initialization

The manager initializes asynchronously (`initRenderer()`): antialiased WebGPU with alpha, shadow maps enabled, and Three’s **WebGL2 fallback** when native WebGPU is unavailable. `isWebGPUSupported()` is informational only — you do not branch on it to pick a renderer.

Legacy code that checked `isWebGPU` should assume WebGPU path; the getter is deprecated and always true.

## What renders each frame

`CameraManager` passes **active cameras** in order (first = bottom layer). For each camera, `RendererManager`:

1. Applies the camera’s normalized **viewport** (scissor region on the canvas).
2. Either calls `renderer.render(scene, camera)` or, when post-processing is set up for a **single fullscreen** primary camera, runs the TSL **RenderPipeline** instead.

Offscreen **render-to-texture** cameras draw into their `RenderTarget` through the same path.

## Post-processing hook

`setupPostProcessing(scene, camera)` builds a half-float MSAA scene pass and chains registered **ZylemPostEffect** functions. Effects receive the current pipeline node plus `{ scenePass, scene, camera }`. Pass-replacing effects (for example pixelation) should be **first** in the chain.

Stage authors register effects via `stageConfig({ postProcessingEffects: [...] })`. The manager’s `setPostProcessingEffects` rebuilds an active pipeline immediately.

**renderScale** (default `1`) supersamples the scene pass before downsample — similar to legacy implicit SSAA. Values above `1` cost GPU; changes apply on the next `setupPostProcessing`.

## Stage transitions

During `game.nextStage({ transition })`, the manager captures the outgoing frame and blends it with the incoming stage using a **ZylemTransitionShader** (default: crossfade). Progress advances only after the incoming pipeline is composed so load time does not consume the blend duration.

## Pitfalls

- **Multiple viewports**: Post-processing applies to single fullscreen primary rendering; split-screen cameras render without the shared post pipeline.
- **Console noise**: WebGPU node-update warnings are filtered at init; do not disable the filter unless debugging Three internals.
- **Size changes**: Canvas CSS size comes from [Resolution and aspect](/docs/rendering/resolution-and-aspect); the manager resizes the renderer when the game canvas delegate fires `onResize`.

## API reference

- [ZylemRenderer](/docs/api/core/type-aliases/ZylemRenderer), [isWebGPUSupported](/docs/api/core/functions/isWebGPUSupported)
- [ZylemPostEffect](/docs/api/graphics/type-aliases/ZylemPostEffect) (re-exported from graphics; implemented in renderer manager)
