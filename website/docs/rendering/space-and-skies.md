---
title: Space, planets, and skies
description: Stage backgrounds, atmospheric day/night skies, and reusable ringed planets
sidebar_position: 4.6
---

Use a stage's `background` setting for solid colors, horizon gradients, space, or atmospheric skies. `createCelestialBody()` creates an independent entity with a rocky or ocean surface, optional atmosphere and rings, and configurable gravity. Graphics own meshes and textures; `OrbitBehavior` and `GravitySourceBehavior` delegate orbital motion and gravity to the simulation WASM runtime.

![Blue ocean planet with subtle darker-blue continents, light-blue atmosphere, red rings, and two moons](/img/rendering/space-planet.png)

## Minimal example

```ts
import { createCamera, createGame, createStage, Perspectives } from '@zylem/game-lib/core';
import { createOrbitPath, OrbitBehavior } from '@zylem/game-lib/behavior';
import { createCelestialBody } from '@zylem/game-lib/graphics';

const planet = createCelestialBody({
	radius: 20,
	surface: { type: 'ocean', oceanColor: '#0864c1', landColor: '#155bb1', oceanCoverage: 0.8 },
	atmosphere: { color: '#5aafff' },
	rings: { innerRadius: 25, outerRadius: 36, tilt: -26, color: '#ef493b' },
	gravity: { surfaceAcceleration: 2.5 },
});

const innerMoon = createCelestialBody({ radius: 1.4, seed: 84 });
innerMoon.use(OrbitBehavior, {
	around: planet,
	path: createOrbitPath({ semiMajorAxis: 39.6, inclination: -26, phase: 35 }),
});
const outerMoon = createCelestialBody({ radius: 1, seed: 85 });
outerMoon.use(OrbitBehavior, {
	around: planet,
	path: createOrbitPath({ semiMajorAxis: 48, eccentricity: 0.04, inclination: 26, phase: 210 }),
});

const camera = createCamera({
	perspective: Perspectives.ThirdPerson,
	position: { x: 0, y: 25, z: -115 },
	target: { x: 0, y: 0, z: 0 },
});

const stage = createStage(
	{
		defaultLighting: false,
		background: {
			type: 'space',
			color: '#02040c',
			stars: { count: 4500, brightness: 1.5 },
			sun: {},
		},
	},
	camera,
	planet, innerMoon, outerMoon
);

createGame({ id: 'ocean-planet' }, stage).start();
```

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

## Body and orbit settings

| Setting | Default | Meaning |
| --- | --- | --- |
| `radius`, `seed` | `1`, `83` | Body size and repeatable surface texture |
| `surface.type` | `rock` | Cratered rock or an `ocean` surface with separate ocean and land colors |
| `surface.color`, `roughness`, `bumpScale` | White tint, `0.9`, `0.025R` | Rock appearance; ocean roughness comes from its procedural map |
| `rotationPeriod` | `140` | Seconds per surface revolution; `0` holds the surface still |
| `atmosphere`, `rings` | Disabled | Add explicit options to enable either layer |
| `gravity` | Disabled | Emit gravity using `surfaceAcceleration` or `gravitationalParameter` (mu = G × mass) |
| `motion` | `fixed` | Use `dynamic` for a body that responds to forces and collisions |

Bodies have spherical colliders. Surface spin is visual and independent of the body's position. Ocean surfaces support `oceanColor`, `landColor`, `oceanCoverage` and `clouds`. Atmospheres accept `color`, `thickness` and `intensity`; rings accept `innerRadius`, `outerRadius`, `tilt`, `color` and `opacity`. The ring casts an analytic shadow on its own body's surface and clouds, and receives the body's shadow. `sunDirection` must match the stage sun; update it with `body.setSunDirection([x, y, z])`.

Each orbit names its primary with `around` and supplies a path. `semiMajorAxis` controls size; `eccentricity` controls elongation (`0` is circular, supported range is `[0, 0.99)`). `inclination`, `ascendingNode`, `argumentOfPeriapsis` and `phase` are degrees. The untilted path lies in XZ; inclination tilts about Z, matching the ring, then ascending node rotates about Y. Paths are oriented in stage axes relative to the primary's position, independent of its visual spin. `phase` is mean anomaly at time zero.

With the default `mode: 'defined'`, WASM samples a stable Keplerian path and owns the body's kinematic position. Omitting `period` derives speed from the primary's gravity. An explicit `period` overrides that speed for authored animation and does not require a gravity source. Gravity has no effect on the prescribed path. A primary and its orbiting entities must belong to the same stage; cyclic parent relationships are rejected.

For a physics trajectory, create a body with `motion: 'dynamic'`, attach `OrbitBehavior` with `mode: 'dynamic'`, and omit `period`. The primary's gravity seeds the initial orbital position and velocity once; afterward all gravity sources, forces and collisions can change the trajectory. Inverse-square gravity becomes linear inside a source's radius to avoid a center singularity. Optional `range` limits influence; `softening` sets a minimum distance. This uses the existing fixed-step physics integrator, so dynamic orbits accumulate numerical error and need an appropriate timestep. The stage's uniform gravity remains additive; space stages should use zero uniform gravity.

Prescribed orbit handles expose `setTimeScale(0)` to pause and `setTime(seconds)` to seek on the next fixed step. Surface/cloud animation has separate controls on the body. Dynamic orbits reject these controls because their paths depend on simulation history. Stage reload rebuilds resources and resets orbital time.

The example uses two explicit paths with opposing inclinations. The inner path clears the ring's outer radius; the outer ellipse's closest approach also clears the inner moon's orbit. Clearance is an authoring responsibility, especially for eccentric or intersecting paths.

## Pitfalls

- Use a perspective camera for space and sky scenes. Tune the far plane to include the planet and moons; stars stay just inside it.
- `background` is setup configuration. To change it, recreate the stage with the new config; mutating the original object does not update a running sky.
- The planet atmosphere is a lightweight stylized shell, not a physical atmosphere simulation or ground-to-orbit transition. Rings use transparent rendering and analytic shadows; moon eclipses on the planet and multi-sun shadows are not modeled.
- Create bodies during loading. Textures are generated once on the CPU; orbital transforms and gravity are computed by WASM. Rendering quality and setup time should be profiled on target hardware.
- Three.js WebGPU is the tested renderer. The WebGL fallback is not covered by the GPU tests.

After building the package, `pnpm --filter @zylem/game-lib test:graphics:space` checks real WebGPU rendering, star camera translation, planet animation, sky day/night, resize, and teardown. A WebGPU adapter is required; for software Vulkan use `SPACE_GPU_BACKEND=vulkan VK_ICD_FILENAMES=/path/to/vk_swiftshader_icd.json`.

## API reference

- [createCelestialBody](/docs/api/graphics/functions/createCelestialBody), [ZylemCelestialBody](/docs/api/graphics/classes/ZylemCelestialBody), [CelestialBodyOptions](/docs/api/graphics/interfaces/CelestialBodyOptions)
- [StageBackground](/docs/api/graphics/type-aliases/StageBackground), [StarOptions](/docs/api/graphics/interfaces/StarOptions)
- [createStageBackground](/docs/api/graphics/functions/createStageBackground) for independently owned Three.js scenes; dispose the returned controller when replacing it
- [createStage](/docs/api/core/functions/createStage), [StageConfigJsonSchema](/docs/api/schema/variables/StageConfigJsonSchema)
