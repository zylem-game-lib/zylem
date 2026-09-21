---
title: Particles and lines
description: Particle system entities and GPU polylines
sidebar_position: 8
---

[createParticleSystem](/docs/api/entity/functions/createParticleSystem) bundles a [ParticleEmitterBehavior](/docs/behaviors/catalog/particle-emitter) with a `GameEntity` anchor so VFX spawns like any other node. [createLine](/docs/api/entity/functions/createLine) builds thick WebGPU polylines for trajectories, debug paths, and stylized beams. Use particle entities for bursts, smoke, and magic; use lines when you need editable point lists or ray picking.

## Minimal example

`website/snippets/entities/particles-and-lines.ts`:

```typescript
import { createLine, createParticleSystem } from '@zylem/game-lib/entity';
import { particlePresets } from '@zylem/game-lib/behavior';

const trail = createLine({
  points: [
    { x: -4, y: 0.1, z: 0 },
    { x: 0, y: 0.1, z: 2 },
    { x: 4, y: 0.1, z: 0 },
  ],
  linewidth: 2,
  color: '#ffcc00',
});

const sparks = createParticleSystem({
  preset: particlePresets.burst(),
  autoplay: true,
  followPosition: true,
});
```

## Particle systems

Options merge [GameEntityOptions](/docs/api/entity/type-aliases/GameEntityOptions) with emitter behavior settings ([ZylemParticleSystemOptions](/docs/api/entity/type-aliases/ZylemParticleSystemOptions)):

| Field | Purpose |
| --- | --- |
| `effect` / `preset` | [ParticleEffectDefinition](/docs/api/behavior/interfaces/ParticleEffectDefinition) factory |
| `autoplay` | Start emitting on spawn |
| `followPosition` / `followRotation` | Keep emitter aligned with the entity transform |
| `localOffset` | Spawn offset in entity space |
| `autoDestroy` | Remove entity when the effect completes |

The entity proxies playback methods (`play`, `pause`, `stop`, `restart`, `isPlaying`) to the underlying behavior handle. Import presets from `@zylem/game-lib/behavior` (`particlePresets`) or pass a custom `effect` factory.

Alternatively attach [ParticleEmitterBehavior](/docs/behaviors/catalog/particle-emitter) directly to any entity with `entity.use(...)` when you do not need a dedicated particle entity type.

## Lines

[ZylemLineOptions](/docs/api/entity/type-aliases/ZylemLineOptions) requires at least two **points** in world space. Optional fields:

- `colors` — per-vertex colors
- `linewidth`, `worldUnits`, dashed styles (`dashed`, `dashSize`, `gapSize`)
- `opacity`, `transparent`, `alphaToCoverage`
- `pickThreshold` — default raycast thickness for [pickZylemLine](/docs/api/entity/functions/pickZylemLine)

Use picking helpers for gameplay that tests clicks against splines or laser arcs.

## Variations

- Clone particle entities for one-shot bursts; clone shares behavior wiring without duplicating preset definitions incorrectly (see unit tests in game-lib).
- Animate line points from `onUpdate` by rebuilding or mutating the entity if your game edits paths frequently.
- Particle entities expose editor selection bounds even though particles themselves are dynamic.

## Pitfalls

- **Effect required** — `createParticleSystem()` without `effect` or `preset` throws at construction time.
- **WebGPU lines** — line materials target the WebGPU line pipeline; verify your renderer path supports `Line2` in the target environment.
- **Autoplay vs manual** — disable `autoplay` when you need synchronized VFX from game events; call `play()` from callbacks.

## API reference

- [createParticleSystem](/docs/api/entity/functions/createParticleSystem) · [ZylemParticleSystem](/docs/api/entity/classes/ZylemParticleSystem) · [PARTICLE_SYSTEM_TYPE](/docs/api/entity/variables/PARTICLE_SYSTEM_TYPE)
- [createLine](/docs/api/entity/functions/createLine) · [ZylemLine](/docs/api/entity/classes/ZylemLine) · [LINE_TYPE](/docs/api/entity/variables/LINE_TYPE)
- [pickZylemLine](/docs/api/entity/functions/pickZylemLine) · [LinePickResult](/docs/api/entity/interfaces/LinePickResult)
