---
title: Post-processing
description: ZylemPostEffect and stage postProcessingEffects
sidebar_position: 4
---

Post-processing is a **chain of TSL node transforms** applied after the scene pass and before display output (including the built-in display-space dither that reduces 8-bit banding on gradients).

## Contract

A **ZylemPostEffect** has the shape:

```ts
(inputNode, { scenePass, scene, camera }) => transformedNode;
```

Effects run in **array order**. Each receives the previous node’s output. The first effect still receives the default scene pass unless it replaces it entirely (pixel/retro effects that rebuild the pass should go first).

Structurally matches `ZylemPostEffect` from `@zylem/shaders`, so packaged effects plug in without an extra adapter.

## Stage configuration

```ts
createStage(
	stageConfig({
		postProcessingEffects: [myBloom, myColorGrade],
	}),
);
```

On load, the stage forwards the list to `RendererManager.setPostProcessingEffects`, which rebuilds the pipeline when one is already active.

## When it runs

Post-processing engages when:

- The renderer has called `setupPostProcessing` for the current scene and primary camera, and
- The frame uses a **single fullscreen** active camera.

Split-screen or multi-viewport layouts skip the shared pipeline and draw cameras directly.

## Supersampling

Set `renderScale` on the manager (via internal game wiring) above `1` to render the scene pass larger before effects downsample — trades GPU for smoother edges.

## Pitfalls

- **Ordering**: Effects that need depth or velocity should read from `ctx.scenePass`, not assume `inputNode` still exposes those channels after prior effects.
- **Transition frames**: Stage transitions temporarily compose their own pipeline graph; custom effects resume after the transition completes.
- **Package split**: Fancy presets may live in `@zylem/shaders`; game-lib only defines the effect function type and stage hook.

## API reference

- [ZylemPostEffect](/docs/api/graphics/type-aliases/ZylemPostEffect)
- Stage field: [stageConfig](/docs/api/core/functions/stageConfig) → `postProcessingEffects`
