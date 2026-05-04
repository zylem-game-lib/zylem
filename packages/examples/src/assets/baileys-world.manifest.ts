/**
 * Hashed CDN paths for the **baileys-world** demo pack.
 *
 * Mirrors the upstream `baileys-world-manifest.json` shipped with the
 * uploaded asset bundle. Combined with the other pack manifests in
 * {@link ./manifest.ts} to form the unified {@link ASSET_PATHS}
 * lookup that drives `demoAsset(...)`.
 *
 * Refresh workflow after re-uploading the pack:
 *   1. Replace the values in this file with the new hashed paths.
 *   2. Add or remove keys to mirror the upstream manifest.
 *   3. `tsc` re-checks every `demoAsset('baileys-world/...')` call site.
 */
export const BAILEYS_WORLD_ASSET_PATHS = {
	'baileys-world/models/starby.glb': 'baileys-world/models/starby.eaec4413.glb',
	'baileys-world/models/cozy-bed.glb': 'baileys-world/models/cozy-bed.d5631434.glb',
	'baileys-world/models/spikey-ball.glb': 'baileys-world/models/spikey-ball.2c5578da.glb',
	'baileys-world/models/avocado.glb': 'baileys-world/models/avocado.c739b214.glb',
	'baileys-world/models/banana.glb': 'baileys-world/models/banana.24c3f2ba.glb',
	'baileys-world/models/purple-bed.glb': 'baileys-world/models/purple-bed.ff1cb978.glb',
	'baileys-world/models/play-rope.glb': 'baileys-world/models/play-rope.6428b91b.glb',
	'baileys-world/models/red-bone.glb': 'baileys-world/models/red-bone.d4e48e54.glb',
	'baileys-world/models/bailey-samba.fbx': 'baileys-world/models/bailey-samba.9a4da764.fbx',
	'baileys-world/images/wall.png': 'baileys-world/images/wall.760b99f2.png',
	'baileys-world/images/floor.png': 'baileys-world/images/floor.ecdc7240.png',
} as const satisfies Record<string, string>;
