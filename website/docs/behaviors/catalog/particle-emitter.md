---
title: Particle emitter
description: GPU burst effects attached to entities
sidebar_position: 12
---

`ParticleEmitterBehavior` plays a `ParticleEffectDefinition` on an entity—typically built from `particlePresets` or `particleEffect`. A stage system instantiates the GPU particle engine, optionally follows entity transform, and exposes transport controls on the handle (`play`, `stop`, `burst`, …).

## Minimal example

`website/snippets/behaviors/catalog/particle-emitter.ts`:

```typescript
import { ParticleEmitterBehavior, particlePresets } from '@zylem/game-lib/behavior';

const emitter = torch.use(ParticleEmitterBehavior, {
  effect: particlePresets.fire.blaze(),
  autoplay: true,
  followPosition: true,
  followRotation: false,
});
```

## Options

| Field | Default | Notes |
| --- | --- | --- |
| `effect` | required | Preset or custom definition. |
| `autoplay` | true | Start on spawn. |
| `followPosition` / `followRotation` | true / true | Parent emitter to entity. |
| `autoDestroy` | false | Remove entity when a one-shot effect finishes. |
| `localOffset` | — | Spawn offset in entity space. |

## Presets

`particlePresets` groups bursts (`burst`, `smoke`) and themed families (`fire`, `water`, `gas`, `electricity`, `magic`) with tunable count, life, size, and speed.

## Handle

- `play()`, `stop()`, `pause()`, `restart()`, `burst()`, `isPlaying()`, `getSystem()`.

## Pitfalls

- Particle construction needs a 2D canvas context in the environment; headless tests stub canvas (see game-lib particle emitter tests).
- Looping effects stay “playing” until stopped; use short one-shot presets for tests.
- `worldSpace` on preset options is retained for API compatibility; follow flags on the behavior control parenting.

## API reference

- [`ParticleEmitterBehavior`](/docs/api), [`particlePresets`](/docs/api), [`particleEffect`](/docs/api)
- Generated reference: [API](/docs/api)
