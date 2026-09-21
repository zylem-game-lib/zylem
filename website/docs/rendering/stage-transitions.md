---
title: Stage transitions
description: Crossfade and custom transition shaders
sidebar_position: 5
---

Navigating stages with a **transition** blends the last frame of the outgoing stage into the first frames of the incoming stage instead of cutting instantly.

## Usage

```ts
game.nextStage({
	transition: {
		duration: 0.8,
		easing: 'easeInOut',
		onComplete: () => console.log('done'),
	},
});
```

`previousStage` and `reset` accept the same `transition` option on their navigation configs.

Omitting fields defaults to **0.8s easeInOut crossfade**. `{}` is valid.

## Custom shaders

Pass `shader` as either:

- A `ZylemTransitionShader` function `( { fromNode, toNode, progress } ) => blendedNode`, or
- An object `{ shader: fn }` (compatible with helpers from `@zylem/shaders`).

game-lib ships **crossfadeTransitionShader** as the default:

```ts
import { crossfadeTransitionShader } from '@zylem/game-lib/graphics';
```

`progress` is a TSL float uniform (0 = outgoing, 1 = incoming) with easing applied on the CPU each frame. Long shader-compile stalls on the first composed frame are capped so they do not swallow the entire blend.

## Renderer behavior

`RendererManager` snapshots the outgoing stage, keeps the incoming stage loading/rendering underneath, and composes the transition into the post pipeline until progress reaches 1. `onComplete` runs once, then transition resources dispose.

## Pitfalls

- **Duration**: Values clamp to a minimum (0.01s) when resolved.
- **Loading time**: Progress does not advance until the transition pipeline is composed — load work does not eat the visible blend time.
- **Custom shaders**: Must return a display-space color node; use `mix` / `clamp` patterns like the built-in crossfade.

## API reference

- [StageTransitionConfig](/docs/api/core/interfaces/StageTransitionConfig), [ZylemTransitionShader](/docs/api/core/type-aliases/ZylemTransitionShader)
- [crossfadeTransitionShader](/docs/api/core/variables/crossfadeTransitionShader), [StageTransitionEasing](/docs/api/core/type-aliases/StageTransitionEasing)
