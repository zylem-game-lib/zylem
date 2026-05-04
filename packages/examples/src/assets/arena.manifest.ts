/**
 * Hashed CDN paths for the **arena** demo pack.
 *
 * Mirrors the upstream `arena-manifest.json` shipped with the
 * uploaded asset bundle. Combined with the other pack manifests in
 * {@link ./manifest.ts} to form the unified {@link ASSET_PATHS}
 * lookup that drives `demoAsset(...)`.
 *
 * Refresh workflow after re-uploading the pack:
 *   1. Replace the values in this file with the new hashed paths.
 *   2. Add or remove keys to mirror the upstream manifest.
 *   3. `tsc` re-checks every `demoAsset('arena/...')` call site.
 */
export const ARENA_ASSET_PATHS = {
	'arena/models/assassin/idle.fbx': 'arena/models/idle.b53bb603.fbx',
	'arena/models/assassin/move.fbx': 'arena/models/move.d747a036.fbx',
	'arena/models/assassin/jump.fbx': 'arena/models/jump.e17f56aa.fbx',
	'arena/models/assassin/attack-light.fbx': 'arena/models/attack-light.6452e7cc.fbx',
	'arena/models/assassin/attack-medium.fbx': 'arena/models/attack-medium.0629a8e0.fbx',
	'arena/models/assassin/attack-heavy.fbx': 'arena/models/attack-heavy.680f4b8e.fbx',
	'arena/models/assassin/damage-light.fbx': 'arena/models/damage-light.6c101d46.fbx',
	'arena/models/assassin/fallen.fbx': 'arena/models/fallen.dc437695.fbx',
	'arena/models/assassin/special-attack.fbx': 'arena/models/special-attack.fe8b5674.fbx',
	'arena/models/assassin/special-stealth.fbx': 'arena/models/special-stealth.64f1b2a3.fbx',
	'arena/models/assassin/assassin.glb': 'arena/models/assassin.9c136dd3.glb',
	'arena/models/assassin/textures/base-color.jpg': 'arena/images/base-color.2d420054.jpg',
	'arena/models/assassin/textures/normal-gl.jpg': 'arena/images/normal-gl.6cd76559.jpg',
	'arena/models/assassin/textures/orm.jpg': 'arena/images/orm.85f775b6.jpg',

	'arena/models/healer/idle.fbx': 'arena/models/idle.fee1cc24.fbx',
	'arena/models/healer/move.fbx': 'arena/models/move.74dc1ac4.fbx',
	'arena/models/healer/jump.fbx': 'arena/models/jump.007f782c.fbx',
	'arena/models/healer/attack-light.fbx': 'arena/models/attack-light.6e028427.fbx',
	'arena/models/healer/attack-heavy.fbx': 'arena/models/attack-heavy.22713167.fbx',
	'arena/models/healer/damage-light.fbx': 'arena/models/damage-light.63e1a704.fbx',
	'arena/models/healer/fallen.fbx': 'arena/models/fallen.751484a0.fbx',
	'arena/models/healer/special-heal.fbx': 'arena/models/special-heal.c1b41c69.fbx',
	'arena/models/healer/special-spell-link.fbx': 'arena/models/special-spell-link.b9a686c2.fbx',
	'arena/models/healer/special-spell-shot.fbx': 'arena/models/special-spell-shot.bf46ab35.fbx',
	'arena/models/healer/healer.glb': 'arena/models/healer.038bde7b.glb',
	'arena/models/healer/textures/base-color.jpg': 'arena/images/base-color.2793edf1.jpg',
	'arena/models/healer/textures/normal-gl.jpg': 'arena/images/normal-gl.249c8ecb.jpg',
	'arena/models/healer/textures/orm.jpg': 'arena/images/orm.40882556.jpg',

	'arena/models/tank/idle.fbx': 'arena/models/idle.2a0981a5.fbx',
	'arena/models/tank/walk.fbx': 'arena/models/walk.b53453b6.fbx',
	'arena/models/tank/jump.fbx': 'arena/models/jump.d040da4c.fbx',
	'arena/models/tank/attack-light.fbx': 'arena/models/attack-light.506ca6e5.fbx',
	'arena/models/tank/attack-medium.fbx': 'arena/models/attack-medium.0e86a512.fbx',
	'arena/models/tank/attack-strong.fbx': 'arena/models/attack-strong.683bb655.fbx',
	'arena/models/tank/damage-light.fbx': 'arena/models/damage-light.ccf21392.fbx',
	'arena/models/tank/damage-heavy.fbx': 'arena/models/damage-heavy.e7c751be.fbx',
	'arena/models/tank/fallen.fbx': 'arena/models/fallen.1c0ad378.fbx',
	'arena/models/tank/special-ground-slam.fbx': 'arena/models/special-ground-slam.584b21f4.fbx',
	'arena/models/tank/special-shield.fbx': 'arena/models/special-shield.4eb53888.fbx',
	'arena/models/tank/special-taunt.fbx': 'arena/models/special-taunt.eded1604.fbx',
	'arena/models/tank/tank.glb': 'arena/models/tank.54c1ba2e.glb',
	'arena/models/tank/textures/base-color.jpg': 'arena/images/base-color.66d24cb2.jpg',
	'arena/models/tank/textures/normal-gl.jpg': 'arena/images/normal-gl.4c6062c9.jpg',
	'arena/models/tank/textures/orm.jpg': 'arena/images/orm.ccfee977.jpg',

	'arena/models/doodads/rock-blue.glb': 'arena/models/rock-blue.e3409823.glb',
	'arena/models/doodads/rock-blue-slanted.glb': 'arena/models/rock-blue-slanted.c0e4bbdd.glb',
	'arena/models/doodads/rock-structure.glb': 'arena/models/rock-structure.b4dc87b3.glb',
	'arena/models/doodads/rock-structure-medium.glb': 'arena/models/rock-structure-medium.d45bd794.glb',
	'arena/models/doodads/rock-structure-small.glb': 'arena/models/rock-structure-small.233af8c9.glb',
	'arena/models/doodads/spike-red.glb': 'arena/models/spike-red.e9742023.glb',

	'arena/images/assassin-art.png': 'arena/images/assassin-art.f3375d2e.png',
	'arena/images/character-select.png': 'arena/images/character-select.1bf704b7.png',
	'arena/images/ground.png': 'arena/images/ground.1843023e.png',
	'arena/images/healer-art.png': 'arena/images/healer-art.98c5c143.png',
	'arena/images/tank-art.png': 'arena/images/tank-art.bd406e0e.png',

	'arena/images/icon-attack.png': 'arena/images/icon-attack.8a6015bb.png',
	'arena/images/icon-cleanse.png': 'arena/images/icon-cleanse.e5c62f97.png',
	'arena/images/icon-dash.png': 'arena/images/icon-dash.5a0dd7af.png',
	'arena/images/icon-execute.png': 'arena/images/icon-execute.173ff5fa.png',
	'arena/images/icon-ground-slam.png': 'arena/images/icon-ground-slam.bb9669dd.png',
	'arena/images/icon-heal.png': 'arena/images/icon-heal.ec749b59.png',
	'arena/images/icon-health-link.png': 'arena/images/icon-health-link.bb27b044.png',
	'arena/images/icon-jump.png': 'arena/images/icon-jump.dac1fb2f.png',
	'arena/images/icon-shield.png': 'arena/images/icon-shield.2f3be3a5.png',
	'arena/images/icon-stealth.png': 'arena/images/icon-stealth.8a2010bf.png',
	'arena/images/icon-taunt.png': 'arena/images/icon-taunt.ddab895e.png',
} as const satisfies Record<string, string>;
