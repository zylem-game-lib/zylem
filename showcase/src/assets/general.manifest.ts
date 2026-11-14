/**
 * Hashed CDN paths for the **general** demo pack (non-arena demos).
 *
 * Mirrors the upstream `general-manifest.json` shipped with the
 * uploaded asset bundle. Combined with the other pack manifests in
 * {@link ./manifest.ts} to form the unified {@link ASSET_PATHS}
 * lookup that drives `demoAsset(...)`.
 *
 * Refresh workflow after re-uploading the pack:
 *   1. Replace the values in this file with the new hashed paths.
 *   2. Add or remove keys to mirror the upstream manifest.
 *   3. `tsc` re-checks every `demoAsset('general/...')` call site.
 */
export const GENERAL_ASSET_PATHS = {
	'general/asteroid.glb': 'general/models/asteroid.dcd8bf9b.glb',
	'general/enemy-ship-green.glb': 'general/models/enemy-ship-green.94bbe148.glb',
	'general/enemy-ship-purple.glb': 'general/models/enemy-ship-purple.443962a3.glb',
	'general/enemy-ship-red.glb': 'general/models/enemy-ship-red.6484c407.glb',
	'general/player-gun.glb': 'general/models/player-gun.b583b675.glb',
	'general/player-ship.glb': 'general/models/player-ship.33f2c659.glb',
	'general/planet-normal-texture.png': 'general/images/planet-normal-texture.c43003bc.png',
	'general/player-sprite.png': 'general/images/player-sprite.f58eb201.png',
	'general/zylem-ship.png': 'general/images/zylem-ship.1df8082a.png',

	'general/skybox-default.png': 'general/images/skybox-default.6d3a9f73.png',
	'general/texture-dirt.png': 'general/images/texture-dirt.7a5fb26b.png',
	'general/texture-grass.jpg': 'general/images/texture-grass.4eca3ab2.jpg',
	'general/texture-grass-normal.png': 'general/images/texture-grass-normal.40af826f.png',
	'general/texture-mars-surface.jpg': 'general/images/texture-mars-surface.ee9f0ed2.jpg',
	'general/texture-steel.png': 'general/images/texture-steel.e83a0bca.png',
	'general/texture-wood-box.jpg': 'general/images/texture-wood-box.05edecfb.jpg',
	'general/rain-man.png': 'general/images/rain-man.8ae29ec8.png',

	'general/space/asteroids/meteor-big-1.png': 'general/images/meteor-big-1.1ec7a519.png',
	'general/space/asteroids/meteor-big-2.png': 'general/images/meteor-big-2.5f991be6.png',
	'general/space/asteroids/meteor-big-3.png': 'general/images/meteor-big-3.429a67b6.png',
	'general/space/asteroids/meteor-big-4.png': 'general/images/meteor-big-4.f98c6257.png',
	'general/space/asteroids/meteor-med-1.png': 'general/images/meteor-med-1.1ed498b7.png',
	'general/space/asteroids/meteor-med-2.png': 'general/images/meteor-med-2.b36318f9.png',
	'general/space/asteroids/meteor-small-1.png': 'general/images/meteor-small-1.4c3e98ec.png',
	'general/space/asteroids/meteor-small-2.png': 'general/images/meteor-small-2.f32e9f10.png',
	'general/space/asteroids/meteor-tiny-1.png': 'general/images/meteor-tiny-1.4f555ee0.png',
	'general/space/asteroids/meteor-tiny-2.png': 'general/images/meteor-tiny-2.c17b0071.png',

	'general/space/player-ship.png': 'general/images/player-ship.c8b490d7.png',
	'general/space/player-jet.png': 'general/images/player-jet.c72470fc.png',
	'general/space/player-laser.png': 'general/images/player-laser.eced881c.png',
	'general/space/enemy-ship.png': 'general/images/enemy-ship.3c4e897f.png',
	'general/space/enemy-laser.png': 'general/images/enemy-laser.552e5924.png',
	'general/space/player-laser-hit-01.png': 'general/images/player-laser-hit-01.25eb8449.png',
	'general/space/player-laser-hit-02.png': 'general/images/player-laser-hit-02.90e529f8.png',
	'general/space/player-laser-hit-03.png': 'general/images/player-laser-hit-03.c80c4bb8.png',
	'general/space/player-laser-hit-04.png': 'general/images/player-laser-hit-04.112f3937.png',

	'general/mascot/idle.fbx': 'general/models/idle.b0c499ff.fbx',
	'general/mascot/run.fbx': 'general/models/run.931e54a7.fbx',

	'general/player/idle.fbx': 'general/models/idle.9c53e2ce.fbx',
	'general/player/walking.fbx': 'general/models/walking.1a0fa45f.fbx',
	'general/player/running.fbx': 'general/models/running.6b52c91c.fbx',
	'general/player/jumping-up.fbx': 'general/models/jumping-up.cacb07a3.fbx',
	'general/player/jumping-down.fbx': 'general/models/jumping-down.fdf4aeb1.fbx',

	'general/audio/bounce.wav': 'general/audio/bounce.186e964e.wav',
	'general/audio/coin-sound.mp3': 'general/audio/coin-sound.bfb7cd13.mp3',
} as const satisfies Record<string, string>;
