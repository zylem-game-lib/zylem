---
title: Background shaders
description: createBackgroundShader and scene.backgroundNode
sidebar_position: 3
---

Stage backgrounds can be a solid color, image, or a **TSL sky pass** evaluated per pixel at infinite depth via Three’s `scene.backgroundNode`.

## createBackgroundShader

`createBackgroundShader(colorNode, transparent?)` wraps a TSL `vec4` node as `ZylemTSLShader` for `stageConfig({ backgroundShader })`.

Inside the node, **`positionWorldDirection`** (from `@zylem/game-lib/graphics`) is the normalized view direction per background pixel — use it for gradients, cubemap-style math, or procedural skies.

Minimal example: `website/snippets/rendering/background-gradient.ts`.

## Stage wiring

```ts
createStage(
	stageConfig({
		backgroundColor: '#000', // fallback if shader fails
		backgroundShader: sky,
	}),
);
```

`ZylemScene` assigns the node to the WebGPU renderer’s background pass. GLSL background shaders are not supported; provide TSL only.

## Pitfalls

- **Missing TSL**: Non-TSL `backgroundShader` values log a warning and keep the solid `backgroundColor`.
- **Transparency**: Set the second argument `transparent: true` only when you need to see geometry behind the clear color through the background pass.
- **Performance**: Full-screen procedural nodes run every pixel every frame — keep math reasonable.

## API reference

- [createBackgroundShader](/docs/api/graphics/functions/createBackgroundShader)
- [positionWorldDirection](/docs/api/graphics/variables/positionWorldDirection) and related TSL exports in [graphics](/docs/api/graphics)
