# ParticleEmitterBehavior

Adds a `three.quarks` particle effect to any entity or powers the standalone
`createParticleSystem(...)` entity.

## Options

- `effect`: required `ParticleEffectDefinition`
- `autoplay`: start playing on spawn, default `true`
- `localOffset`: optional offset from the host transform
- `followPosition`: follow host position, default `true`
- `followRotation`: follow host rotation, default `true`
- `autoDestroy`: dispose one-shot effects and destroy standalone particle
  entities when finished, default `false`

## Handle

- `play()`
- `pause()`
- `stop()`
- `restart()`
- `burst()`
- `isPlaying()`
- `getSystem()`

## Usage

```ts
import {
	createBox,
	ParticleEmitterBehavior,
	particlePresets,
} from '@zylem/game-lib';

const box = createBox({ position: { x: 0, y: 0, z: 0 } });

box.use(ParticleEmitterBehavior, {
	effect: particlePresets.fire.spark(),
	localOffset: { x: 0, y: 1, z: 0 },
});
```

## Semantic taxonomies

`particlePresets` now includes semantic families that wrap QUARKS with
lower-configuration presets:

```ts
import { createParticleSystem, particlePresets } from '@zylem/game-lib';

const muzzleFlash = createParticleSystem({
	preset: particlePresets.fire.spark(),
	autoplay: false,
});

const holyMist = createParticleSystem({
	preset: particlePresets.water.mist({
		magic: 'holy',
	}),
});

const arcaneBlaze = createParticleSystem({
	preset: particlePresets.fire.blaze({
		magic: particlePresets.magic.arcane({
			order: 'geometric',
			realityEffect: 'warping',
		}),
	}),
});
```

Current semantic families:

- `particlePresets.fire.*`
- `particlePresets.water.*`
- `particlePresets.gas.*`
- `particlePresets.electricity.*`
- `particlePresets.magic.*` for modifier presets such as `arcane()` or `holy()`

## Textured presets

Preset helpers also accept a `three` texture plus Quarks tile settings for
sprite sheets:

```ts
import { AdditiveBlending, TextureLoader } from 'three';
import hitSprite from '@zylem/assets/2d/space/player-laser-hit-03.png';
import { particlePresets } from '@zylem/game-lib';

const texture = new TextureLoader().load(hitSprite);

const burst = particlePresets.burst({
	color: '#67e8f9',
	texture,
	opacity: 0.9,
	depthWrite: false,
	alphaTest: 0.01,
	blending: AdditiveBlending,
	uTileCount: 4,
	vTileCount: 4,
	blendTiles: true,
});
```
