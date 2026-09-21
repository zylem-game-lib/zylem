---
title: Lights and fog
description: Stage lighting entities and atmospheric fog
sidebar_position: 7
---

[createLight](/docs/api/entity/functions/createLight) wraps Three.js lights so they spawn through the same `stage.add(...)` pipeline as meshes. [createFog](/docs/api/entity/functions/createFog) owns scene fog plus optional height falloff and animated noise modulators. Add both when you want mood, readability, or shadowed outdoor scenes without hand-wiring Three.js objects in game code.

## Minimal example

`website/snippets/entities/lights-and-fog.ts`:

```typescript
import { createLight, createFog } from '@zylem/game-lib/entity';

const sun = createLight({
  type: 'directional',
  intensity: 1.2,
  position: { x: 10, y: 20, z: 10 },
  target: { x: 0, y: 0, z: 0 },
  castShadow: true,
});

const mist = createFog({
  type: 'linear',
  color: '#9aa3ad',
  start: 15,
  end: 80,
  height: { enabled: true, level: 4, falloff: 0.25 },
});
```

## Lights

[ZylemLightOptions](/docs/api/entity/type-aliases/ZylemLightOptions) is a discriminated union on `type`:

| type | Use case |
| --- | --- |
| `ambient` | Flat fill (no position) |
| `hemisphere` | Sky / ground gradient |
| `directional` | Sun or moon; supports shadow maps |
| `point` | Local lamp with distance falloff |
| `spot` | Cone spotlight with angle and penumbra |

Directional and spot lights accept a **target** point; the entity group moves both the light and its aim object. Shadow tuning lives in [LightShadowOptions](/docs/api/entity/interfaces/LightShadowOptions) (`mapSize`, bias, orthographic bounds for directional lights).

Access the underlying Three.js instance via [ZylemLight.light](/docs/api/entity/classes/ZylemLight#light) when you need engine-specific tweaks.

## Fog

[ZylemFogOptions](/docs/api/entity/interfaces/ZylemFogOptions) controls:

- **type** — `'linear'` (start/end distances) or `'exp2'` (density coefficient)
- **color** — fog tint applied to the scene
- **height** — optional ground fog ([ZylemFogHeightOptions](/docs/api/entity/interfaces/ZylemFogHeightOptions))
- **noise** — optional animated density variation ([ZylemFogNoiseOptions](/docs/api/entity/interfaces/ZylemFogNoiseOptions))

Fog entities attach during spawn and clean up GPU patch state on teardown.

## Variations

- Combine a low-intensity hemisphere fill with a single shadow-casting directional key light for outdoor stages.
- Use exp² fog for horror interiors where distance falloff should accelerate quickly.
- Lights and fog entities have no colliders—they do not interact with physics.

## Pitfalls

- **Shadow frustum** — directional shadow cameras default to a broad orthographic box; tighten `shadow.left/right/top/bottom` to improve texel density where gameplay happens.
- **Too many shadow casters** — each casting light adds draw calls; prefer one sun plus baked or fake lighting for mobile targets.
- **Linear vs exp2** — mixing fog types on one stage is unsupported; pick one model per fog entity.

## API reference

- [createLight](/docs/api/entity/functions/createLight) · [ZylemLight](/docs/api/entity/classes/ZylemLight) · [LIGHT_TYPE](/docs/api/entity/variables/LIGHT_TYPE)
- [AmbientLightOptions](/docs/api/entity/interfaces/AmbientLightOptions) · [DirectionalLightOptions](/docs/api/entity/interfaces/DirectionalLightOptions) · [PointLightOptions](/docs/api/entity/interfaces/PointLightOptions) · [SpotLightOptions](/docs/api/entity/interfaces/SpotLightOptions)
- [createFog](/docs/api/entity/functions/createFog) · [ZylemFog](/docs/api/entity/classes/ZylemFog) · [FOG_TYPE](/docs/api/entity/variables/FOG_TYPE)
