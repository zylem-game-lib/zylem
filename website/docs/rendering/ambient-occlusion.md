---
title: Ambient occlusion
description: Stage-configurable SSAO, GTAO, and CORTAO
sidebar_position: 4.5
---

Ambient occlusion adds local contact shading to the indirect lighting of standard lit materials. It lives in graphics and is configured separately for each stage. It is off by default: omitting `ambientOcclusion` allocates no AO passes or textures.

## Minimal example

```ts
import { createStage } from '@zylem/game-lib/core';
import type { AmbientOcclusionSettings } from '@zylem/game-lib/graphics';

const ambientOcclusion = {
	method: 'cortao', // 'ssao' | 'gtao' | 'cortao'
	quality: 'medium',
	radius: 1, // world units
	intensity: 1, // visibility exponent; 0 disables AO
	denoise: true,
} satisfies AmbientOcclusionSettings;

const courtyard = createStage({ ambientOcclusion });
const menu = createStage({ ambientOcclusion: false });
```

The setting is also part of [StageConfigJsonSchema](/docs/api/schema/variables/StageConfigJsonSchema), so stage blueprints can persist it and editor tools can inspect its schema. Switching to a stage without AO resets the previous stage's selection. Camera replacement rebuilds the AO graph; resize and DPR changes resize its targets automatically.

## Methods

| Method | Implementation |
| --- | --- |
| `ssao` | Three.js SSAO node |
| `gtao` | Three.js ground-truth ambient occlusion node |
| `cortao` | Zylem TSL adaptation of CORTAO's circular-occluder kernel and ray-mask lookup table |

## Settings

| Setting | Default | Notes |
| --- | --- | --- |
| `method` | required | `ssao`, `gtao`, or `cortao` |
| `quality` | `medium` | `low` / `medium` / `high` select 8 / 16 / 32 samples |
| `radius` | `1` | World units; must be positive |
| `intensity` | `1` | Visibility exponent; must be nonnegative, and `0` disables AO |
| `resolutionScale` | `0.5` for low and medium, `1` for high | Fraction of drawing-buffer resolution; any number greater than 0 and at most 1 |
| `denoise` | `true` | Enables a depth/normal-aware spatial filter |

All numeric settings must be finite. Radius has the same world-unit meaning across methods, but their appearance is not numerically identical.

## Where it runs

AO runs before the existing stage [post-processing](/docs/rendering/post-processing) effects and is applied through Three.js's indirect-lighting context. It preserves direct lighting and emission. It follows the existing single fullscreen-camera postprocessing path.

## Custom render graphs

For an independently owned Three.js render graph, `createAmbientOcclusion(scene, camera, settings)` from `@zylem/game-lib/graphics` returns `{ contextNode, config, dispose }`, or `null` when off. Assign the context to a scene `PassNode` and dispose the result when replacing that graph. The runtime renderer manager also exposes `setAmbientOcclusion(settings)` to rebuild the active pipeline.

## CORTAO port scope

The port adapts [CORTAO v1.0.0](https://github.com/theagentd/CORTAO/tree/e5b99012c6f70d50e889de643e0a858879342ecb), by Daniel Isheden, under the MIT license. Attribution and the full license ship in the package's `THIRD_PARTY_NOTICES.md`.

It preserves the circular-occluder sampling, slope compensation, normal adjustment, cosine-weighted 16-ray masks, and 24×24×16 lookup table. The lookup generator is checked against the upstream generator's output. TSL renders the kernel as a fullscreen pass using full-precision depth and view normals; it supports perspective and orthographic projection.

This first port uses static noise and spatial filtering. It does not include the reference's packed depth/normal mip prepass, temporal accumulation, bent normals, or a hardware ray-tracing backend. It has not been benchmarked against native CORTAO, and no native performance or image-quality equivalence is implied.

## Pitfalls

- **Transparent and custom materials**: Transparent materials do not receive AO. Custom shaders must participate in Three.js's lighting/AO context to receive it.
- **Multiple viewports**: Split-screen and render-to-texture cameras bypass AO.
- **Screen-space limits**: As a screen-space method, it cannot see occluders outside the rendered view and can show edge artifacts or sampling noise. Start with GTAO or SSAO when comparing results for a particular level.
- **Runtime changes are not saved**: `setAmbientOcclusion` changes the active graph, not the stage's saved configuration.

## Verification

Unit tests cover configuration, the JSON schema, lookup equivalence, and graph disposal/replacement. After building the package, run `pnpm --filter @zylem/game-lib test:graphics:ao` for real WebGPU shader and rendering checks through the Node Dawn `webgpu` development dependency. A hardware adapter or software Vulkan ICD is required; the test fails if none is available. For example, on a Linux machine with SwiftShader installed:

```bash
AO_GPU_BACKEND=vulkan VK_ICD_FILENAMES=/path/to/vk_swiftshader_icd.json pnpm --filter @zylem/game-lib test:graphics:ao
```

The GPU test checks every method and quality with both camera projections, preserved emission/background, contact occlusion, resize, and texture teardown. WebGL2 fallback is not covered by this test.

## API reference

- [AmbientOcclusionSettings](/docs/api/graphics/interfaces/AmbientOcclusionSettings), [AmbientOcclusionOptions](/docs/api/graphics/type-aliases/AmbientOcclusionOptions)
- [createAmbientOcclusion](/docs/api/graphics/functions/createAmbientOcclusion), [resolveAmbientOcclusion](/docs/api/graphics/functions/resolveAmbientOcclusion)
- Stage field: [createStage](/docs/api/core/functions/createStage) → `ambientOcclusion`
