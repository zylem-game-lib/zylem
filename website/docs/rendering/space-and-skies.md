---
title: Space, planets, and skies
description: Stage backgrounds, atmospheric day/night skies, and reusable ringed planets
sidebar_position: 4.6
---

Use a stage's `background` setting for solid colors, horizon gradients, space, or atmospheric skies. `createPlanet()` adds an ocean world with clouds, a light-blue atmospheric rim, rings, and optional moons. Both APIs live in graphics; the stage owns background resources and the planet entity owns its meshes and textures.

![Blue ocean planet with violet-blue continents, light-blue atmosphere, rings, and two moons](/img/rendering/space-planet.png)

## Minimal example

```ts
import { createCamera, createGame, createStage, Perspectives } from '@zylem/game-lib/core';
import { createPlanet } from '@zylem/game-lib/graphics';

const planet = createPlanet({
	radius: 20,
	surface: { oceanColor: '#075daf', landColor: '#454e89', oceanCoverage: 0.8 },
	atmosphere: { color: '#8edbff' },
	rings: { innerRadius: 25, outerRadius: 36, tilt: 26 },
	moons: 'crossed',
});

const camera = createCamera({
	perspective: Perspectives.ThirdPerson,
	position: { x: 0, y: 25, z: -115 },
	target: { x: 0, y: 0, z: 0 },
});

const stage = createStage({
	defaultLighting: false,
	background: {
		type: 'space',
		color: '#02040c',
		stars: { count: 4500, brightness: 1.5 },
		sun: {},
	},
}, camera, planet);

createGame({ id: 'ocean-planet' }, stage).start();
```

The defaults already provide the blue ocean, blue-purple land, light-blue rim, and tilted rings. `createPlanet({ moons: 'crossed' })` is sufficient when those defaults suit the scene.

## Background modes

| Mode | Example | Lighting |
| --- | --- | --- |
| Solid color | `{ type: 'color', color: '#080a24' }` | No added lights |
| Gradient | `{ type: 'gradient', top: '#101435', horizon: '#6574ab', bottom: '#17192f' }` | No added lights |
| Space | `{ type: 'space', color: '#02040c', stars: { count: 3500 }, sun: {} }` | Optional directional sun and ambient fill |
| Sky | `{ type: 'sky', timeOfDay: 14, cycleDuration: 120 }` | Sun and environment lighting follow the sky |

Colors accept CSS strings or numeric hex values. The discriminated `StageBackground` union is serializable and appears in `StageConfigJsonSchema`, so editors can save it with a stage. When present, it takes precedence over `backgroundColor`, `backgroundImage`, and `backgroundShader`. Omitting it preserves legacy behavior.

Stars use a seeded catalog and Gaussian sprites with varied brightness and warm/cool tint. They follow camera translation, preserving their apparent distance. `stars: false` disables them. Star options are `count` (3500 additional stars by default), `seed` (42), `brightness` (1), and `size` (0.65 CSS pixels). Space stars have no atmospheric twinkle.

## Day and night

For a ground-level scene, choose `type: 'sky'`. `timeOfDay` is hours in `[0, 24]`; `cycleDuration` is seconds per full day. Omit the duration for a fixed time. `latitude` defaults to 37 degrees, `quality` to `medium`, `exposure` to 40, and `preset` to `earth`; `mars` and `titan` are also available. Set `defaultLighting: false` to use the sky's lighting without the stage's default lights.

The sky uses MIT-licensed [`@pmndrs/sky`](https://github.com/pmndrs/sky), loaded when sky or stars are requested. Its full MIT notice ships with Zylem. Atmospheric skies use its scattering and environment lighting; space uses its star catalog with a vacuum sprite adaptation. Zylem disables aerial perspective in this integration. The day/night cycle uses the primary camera and is intended for a single full-screen view.

## Planet settings

| Setting | Default | Meaning |
| --- | --- | --- |
| `radius`, `seed` | `20`, `83` | World radius and repeatable geography |
| `rotationPeriod` | `140` | Seconds per surface revolution; `0` freezes surface and clouds |
| `surface.oceanCoverage` | `0.8` | Artistic sea-level control in `[0, 1]`, not an exact area percentage |
| `surface.clouds` | `true` | Separate, slowly drifting cloud layer |
| `atmosphere` | Light blue, thickness `0.035`, intensity `1` | Stylized rim; thickness is a fraction of planet radius; `false` disables it |
| `rings` | Inner radius `1.25R`, outer radius `1.8R`, tilt `26°`, opacity `0.72` | Banded translucent annulus; `false` disables it |
| `moons` | `[]` | `'crossed'` or an explicit list of moon options |

The surface has separate ocean/land roughness and seeded spherical noise. The ring has filtered radial bands, gaps, a planet shadow, and casts an analytic shadow on the surface, clouds, and moons. Materials respond to scene lights. `sunDirection` controls the analytic shadows and atmospheric rim; it defaults to the same direction as the space background's sun. When changing that sun, provide the same direction to the planet or call `planet.setSunDirection([x, y, z])`.

`moons: 'crossed'` creates two cratered natural moons in oppositely tilted circular orbits. The inner orbit is coplanar with, and just outside, the ring. The second has a larger radius, so the paths cross in projection without the moons colliding. Their periods are 48 and 71 seconds. The X appearance depends on viewing angle; the example camera makes the opposing tilts readable.

For custom moons, supply `{ radius, seed, orbit: { radius, period, inclination, ascendingNode, phase } }` entries. Distances are world units, periods are seconds, and angles are degrees. The untilted orbit is in the planet's local XZ plane; inclination tilts about Z, then ascending node rotates about Y. Custom orbits must clear the planet and ring; arrange their mutual spacing yourself.

Use `planet.setTimeScale(0)` to pause all animation, `setTimeScale(1)` to resume, and `setTime(seconds)` to scrub. The planet recreates its resources and starts at time zero when the stage reloads. Orbits are visual animation with no allocated physics bodies.

## Pitfalls

- Use a perspective camera for space and sky scenes. Tune the far plane to include the planet and moons; stars stay just inside it.
- `background` is setup configuration. To change it, recreate the stage with the new config; mutating the original object does not update a running sky.
- The planet atmosphere is a lightweight stylized shell, not a physical atmosphere simulation or ground-to-orbit transition. Rings use transparent rendering and analytic shadows; moon eclipses on the planet and multi-sun shadows are not modeled.
- Generate planets during loading. Textures are created once on the CPU; per-frame work only updates transforms. Rendering quality and setup time should be profiled on target hardware.
- Three.js WebGPU is the tested renderer. The WebGL fallback is not covered by the GPU tests.

After building the package, `pnpm --filter @zylem/game-lib test:graphics:space` checks real WebGPU rendering, star camera translation, planet animation, sky day/night, resize, and teardown. A WebGPU adapter is required; for software Vulkan use `SPACE_GPU_BACKEND=vulkan VK_ICD_FILENAMES=/path/to/vk_swiftshader_icd.json`.

## API reference

- [createPlanet](/docs/api/graphics/functions/createPlanet), [ZylemPlanet](/docs/api/graphics/classes/ZylemPlanet), [PlanetOptions](/docs/api/graphics/interfaces/PlanetOptions)
- [StageBackground](/docs/api/graphics/type-aliases/StageBackground), [StarOptions](/docs/api/graphics/interfaces/StarOptions)
- [createStageBackground](/docs/api/graphics/functions/createStageBackground) for independently owned Three.js scenes; dispose the returned controller when replacing it
- [createStage](/docs/api/core/functions/createStage), [StageConfigJsonSchema](/docs/api/schema/variables/StageConfigJsonSchema)
