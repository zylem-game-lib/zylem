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

	'general/skybox-default.png': 'general/images/skybox-default.6d3a9f73.png',
	'general/texture-dirt.png': 'general/images/texture-dirt.7a5fb26b.png',
	'general/texture-grass.jpg': 'general/images/texture-grass.4eca3ab2.jpg',
	'general/texture-grass-normal.png': 'general/images/texture-grass-normal.40af826f.png',
	'general/texture-mars-surface.jpg': 'general/images/texture-mars-surface.ee9f0ed2.jpg',
	'general/texture-steel.png': 'general/images/texture-steel.e83a0bca.png',
	'general/texture-wood-box.jpg': 'general/images/texture-wood-box.05edecfb.jpg',

	'general/mascot/idle.fbx': 'general/models/idle.b0c499ff.fbx',
	'general/mascot/run.fbx': 'general/models/run.931e54a7.fbx',

	'general/player/idle.fbx': 'general/models/idle.9c53e2ce.fbx',
	'general/player/walking.fbx': 'general/models/walking.1a0fa45f.fbx',
	'general/player/running.fbx': 'general/models/running.6b52c91c.fbx',
	'general/player/jumping-up.fbx': 'general/models/jumping-up.cacb07a3.fbx',
	'general/player/jumping-down.fbx': 'general/models/jumping-down.fdf4aeb1.fbx',
} as const satisfies Record<string, string>;
