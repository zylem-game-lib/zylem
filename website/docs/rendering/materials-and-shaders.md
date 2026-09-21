---
title: Materials and shaders
description: TSL node materials, standard shader, and entity materials
sidebar_position: 2
---

game-lib renders with **WebGPU node materials**. Entity factories accept `material: { color, shader, normalMap, repeat, opacity }` and build cached `MeshStandardNodeMaterial` (or basic variants) through the internal material builder.

## Shader types

| Type | Status | Shape |
| --- | --- | --- |
| `ZylemTSLShader` | **Supported** | `{ colorNode, positionNode?, normalNode?, transparent?, blending?, side?, depthTest? }` |
| `ZylemShaderObject` (GLSL) | **Deprecated** | `{ vertex, fragment }` — logs a warning and falls back to default nodes |

Use `isTSLShader` / `isGLSLShader` when accepting either shape. `standardShader` is the built-in GLSL sentinel for “default PBR”; new work should author **TSL** with `createNodeMaterialFromTSL`.

## Authoring TSL on entities

Import TSL helpers from `@zylem/game-lib/graphics`:

```ts
import { Fn, uniform, vec3, vec4 } from '@zylem/game-lib/graphics';

entity.setMaterial({
	shader: {
		colorNode: Fn(() => vec4(vec3(1, 0.2, 0.1), 1))(),
	},
});
```

`objectVertexShader` remains exported for compatibility; prefer `positionNode` on `ZylemTSLShader` for displacement.

Textures load through material `path` / `normalMap` with optional `repeat`. Shared materials dedupe by hashed options — reuse paths when possible.

## Pitfalls

- **GLSL custom shaders** do not compile on WebGPU; migrate to TSL.
- **Low-poly displacement** needs sufficient geometry subdivisions when using `positionNode`.
- **useTSL** on `MaterialOptions` is ignored (WebGPU-only path always uses nodes).

## API reference

- [ZylemShader](/docs/api/graphics/type-aliases/ZylemShader), [ZylemTSLShader](/docs/api/graphics/type-aliases/ZylemTSLShader)
- [createNodeMaterialFromTSL](/docs/api/graphics/functions/createNodeMaterialFromTSL), [standardShader](/docs/api/graphics/variables/standardShader)
- TSL re-exports: [uniform](/docs/api/graphics/variables/uniform), [Fn](/docs/api/graphics/variables/Fn), [vec3](/docs/api/graphics/variables/vec3), [vec4](/docs/api/graphics/variables/vec4)
