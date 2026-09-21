---
title: Render strategies
description: Scene-direct, environment bundles, and instanced pack
sidebar_position: 6
---

Each entity’s mesh can render **directly in the scene graph** or through a managed path chosen by `options.category`. **RenderStrategyManager** (per stage) routes entities at registration time.

## Categories

| `category` | Path | Behavior |
| --- | --- | --- |
| `none` (default) | Scene-direct | Normal Three.js mesh in the entity group |
| `environment` | WebGPU **render bundles** | Static-ish geometry batched for fewer draw calls; mesh may stay visible |
| `pack` | **Instanced** meshes | Many copies of the same geometry/material; source mesh hidden |

Set category on factory options, for example `createBox({ category: 'pack' })`.

## Registration rules

Managed registration requires `mesh.geometry` and at least one material. Failures fall back silently to scene-direct rendering.

`environment` entities are forced toward **static** collision in the stage delegate so simulated props do not fight bundle assumptions.

## Updates

Instanced packs update transforms each frame via `RenderStrategyManager.update(interpolationAlpha)` using the same interpolation alpha as physics (see [Physics overview](/docs/physics/overview)).

Bundles and instances unregister on entity destroy.

## When to use which

- **`none`**: Unique meshes, skinned actors, anything that changes materials frequently.
- **`environment`**: Large static level chunks, terrain pieces, repeated architecture with few materials.
- **`pack`**: Many identical props (trees, crates, bullets) sharing one geometry/material key.

## Pitfalls

- **Material changes** on packed entities require re-registration; prefer homogeneous batches.
- **Visibility**: Packed entities hide the source mesh — debug picking uses entity bounds, not the hidden mesh.
- **Category typos** default to `none` with no warning.

## API reference

Rendering strategy types are internal to game-lib; entity option `category` is documented on [entity factories](/docs/api/entity). Related: [Renderers](/docs/rendering/renderers) for the shared WebGPU path.
