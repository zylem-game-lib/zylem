/**
 * Unified CDN asset manifest for every demo pack.
 *
 * Single source of truth for every binary asset (models, animations,
 * textures, UI images) the demos load at runtime. Per-pack hashed
 * relative paths live in sibling `*.manifest.ts` files and are merged
 * here; the {@link demoAsset} helper composes them with a
 * configurable base URL.
 *
 * Why split base + path:
 *   - **Dev**: a Vite proxy at `/cdn` forwards to `assets.zylem.cloud`
 *     so the browser sees same-origin requests and CORS errors don't
 *     block local development.
 *   - **Prod**: the base resolves to the real CDN origin so deployed
 *     builds load assets directly from `assets.zylem.cloud`. The CDN
 *     bucket must be configured with CORS rules permitting the deploy
 *     origin (see `scripts/cdn/r2-cors.json`).
 *   - **CI / overrides**: set `VITE_DEMOS_ASSET_BASE_URL` to point at
 *     a staging CDN, a local mirror, or any other host without
 *     touching this file.
 *
 * Adding a new pack:
 *   1. Create `<pack>.manifest.ts` next to this file, exporting
 *      `<PACK>_ASSET_PATHS` with `<pack>/...`-prefixed keys.
 *   2. Import it below and spread into {@link ASSET_PATHS}.
 *   3. The {@link DemoAssetKey} union and every `demoAsset(...)` call
 *      site is re-checked by `tsc`.
 */

import { GENERAL_ASSET_PATHS } from './general.manifest';
import { ARENA_ASSET_PATHS } from './arena.manifest';
import { BAILEYS_WORLD_ASSET_PATHS } from './baileys-world.manifest';

const PRODUCTION_BASE_URL = 'https://assets.zylem.cloud/demos';
const DEV_BASE_URL = '/cdn/demos';

/**
 * Resolve the base URL used to compose asset URLs at runtime.
 *
 * Precedence:
 *   1. `VITE_DEMOS_ASSET_BASE_URL` env var (build-time substitution).
 *   2. The Vite-proxied `/cdn` prefix during `vite dev` / `vite preview`.
 *   3. The production CDN origin for production builds.
 */
function resolveBaseUrl(): string {
	const env = (import.meta as ImportMeta).env;
	const override = env?.VITE_DEMOS_ASSET_BASE_URL;
	if (override && override.length > 0) {
		return override.replace(/\/+$/, '');
	}
	return env?.DEV ? DEV_BASE_URL : PRODUCTION_BASE_URL;
}

const DEMOS_ASSET_BASE_URL = resolveBaseUrl();

/**
 * Hashed relative paths for every demo asset, keyed by `<pack>/<logical-path>`.
 *
 * The leading segment selects the demo pack (`arena/...`, `general/...`)
 * and is preserved in the resolved URL so a single base URL can serve
 * every pack from `https://assets.zylem.cloud/demos/`.
 *
 * The actual entries live in the per-pack `*.manifest.ts` files;
 * spreads here just merge them into one lookup.
 */
const ASSET_PATHS = {
	...GENERAL_ASSET_PATHS,
	...ARENA_ASSET_PATHS,
	...BAILEYS_WORLD_ASSET_PATHS,
} as const satisfies Record<string, string>;

/** Union of every valid demo asset key (`'general/player-ship.glb' | 'arena/models/tank/idle.fbx' | ...`). */
export type DemoAssetKey = keyof typeof ASSET_PATHS;

/**
 * Resolve a logical demo asset path to its full URL.
 *
 * The returned URL is composed at runtime from
 * {@link DEMOS_ASSET_BASE_URL} and the asset's hashed path, so the
 * same call site automatically follows the dev proxy in development
 * and points at the real CDN in production.
 *
 * @param key Pack-namespaced asset path. Auto-completed by your editor.
 * @returns Fully-qualified URL for the asset.
 */
export function demoAsset<K extends DemoAssetKey>(key: K): string {
	return `${DEMOS_ASSET_BASE_URL}/${ASSET_PATHS[key]}`;
}

/**
 * Read-only view of every key/URL pair, useful for prefetching or
 * iterating the manifest without rebuilding URLs by hand.
 */
export const DEMO_ASSETS: { readonly [K in DemoAssetKey]: string } =
	Object.freeze(
		Object.fromEntries(
			(Object.keys(ASSET_PATHS) as DemoAssetKey[]).map(
				(key) => [key, demoAsset(key)] as const,
			),
		) as { [K in DemoAssetKey]: string },
	);
