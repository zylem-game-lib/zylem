import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';
import solidPlugin from 'vite-plugin-solid';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import path from 'path';
import { fileURLToPath } from 'url';
import { Agent } from 'https';
import { Resolver } from 'dns';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultAllowedHosts = ['zylem.onrender.com', 'zylem-staging.onrender.com'];
const additionalAllowedHosts = (process.env.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS ?? '')
	.split(',')
	.map(host => host.trim())
	.filter(Boolean);
const allowedHosts = [...new Set([...defaultAllowedHosts, ...additionalAllowedHosts])];
const devPort = Number(process.env.PORT ?? '1337');

/**
 * HTTPS agent that resolves hostnames via direct DNS queries (Cloudflare
 * `1.1.1.1` / `1.0.0.1`) instead of libc's `getaddrinfo`.
 *
 * macOS's `mDNSResponder` occasionally caches negative results for
 * recently-flipped DNS records (e.g. when the arena CDN's custom domain
 * was first stood up). Once that happens, every Node-side proxy request
 * fails with `ENOTFOUND` even though `dig`/`curl` resolve the host
 * fine. Pinning the proxy to direct DNS keeps the dev server resilient
 * to that local resolver state without forcing every contributor to run
 * `sudo dscacheutil -flushcache`.
 */
const cdnDnsResolver = new Resolver();
cdnDnsResolver.setServers(['1.1.1.1', '1.0.0.1']);

/**
 * `dns.lookup`-compatible function backed by direct DNS queries.
 *
 * Honours both call styles:
 *   - `lookup(host, callback)` / `lookup(host, { all: false }, callback)`
 *     → returns the first IPv4 (then falls back to IPv6) as a string.
 *   - `lookup(host, { all: true }, callback)` → returns an array of
 *     `{ address, family }` entries for **every** resolved address,
 *     which is the form Node's HTTP `Agent` uses internally so it can
 *     try addresses in order.
 */
function cdnDnsLookup(
	hostname: string,
	options: { all?: boolean; family?: number } | ((err: NodeJS.ErrnoException | null, address: string, family: number) => void),
	callback?: (err: NodeJS.ErrnoException | null, address: string | { address: string; family: number }[], family?: number) => void,
): void {
	const opts = typeof options === 'function' ? {} : options;
	const cb = (typeof options === 'function' ? options : callback) as (
		err: NodeJS.ErrnoException | null,
		address: string | { address: string; family: number }[],
		family?: number,
	) => void;

	cdnDnsResolver.resolve4(hostname, (v4Err, v4Addrs) => {
		const v4 = (v4Addrs ?? []).map((address) => ({ address, family: 4 as const }));
		cdnDnsResolver.resolve6(hostname, (v6Err, v6Addrs) => {
			const v6 = (v6Addrs ?? []).map((address) => ({ address, family: 6 as const }));
			const all = [...v4, ...v6];
			if (all.length === 0) {
				const failure = (v4Err ?? v6Err ?? new Error(`No DNS answer for ${hostname}`)) as NodeJS.ErrnoException;
				cb(failure, '', 0);
				return;
			}
			if (opts.all) {
				cb(null, all);
				return;
			}
			const first = all[0]!;
			cb(null, first.address, first.family);
		});
	});
}

const cdnProxyAgent = new Agent({
	keepAlive: true,
	lookup: cdnDnsLookup as any,
});
const shouldOpenBrowser = !(
	process.env.CI === 'true' ||
	process.env.RENDER === 'true' ||
	process.env.PORT
);

export default defineConfig({
	plugins: [glsl(), vanillaExtractPlugin(), solidPlugin()] as any,
	build: {
		target: 'esnext',
	},
	resolve: {
		alias: [
			// Examples source
			{ find: '@examples', replacement: path.resolve(__dirname, './src') },

			// Editor package aliases REMOVED - using built package

			// Styles aliases - Strict ordering required
			// 1. Force styles.css to resolve to the bundled dist file
			{ find: '@zylem/styles/styles.css', replacement: path.resolve(__dirname, '../zylem-styles/dist/styles.css') },
			// 2. Fallback for other imports (e.g. source files)
			{ find: '@zylem/styles', replacement: path.resolve(__dirname, '../zylem-styles/src') },
		],
	},
	assetsInclude: ['**/*.fbx', '**/*.gltf', '**/*.glb', '**/*.wasm'],
	server: {
		port: Number.isFinite(devPort) ? devPort : 1337,
		open: shouldOpenBrowser,
		allowedHosts,
		fs: {
			// Allow serving files from sibling packages (e.g. game-lib source for workers)
			allow: [path.resolve(__dirname, '..')],
		},
		// Same-origin proxy for the demos CDN. Lets dev builds load
		// `assets.zylem.cloud` without tripping CORS while we wait for the
		// bucket-side rules to propagate (or for new origins to be added).
		// `demoAsset(...)` composes URLs against `/cdn` automatically when
		// `import.meta.env.DEV` is true; production builds bypass this proxy
		// and hit the CDN origin directly.
		proxy: {
			'/cdn': {
				target: 'https://assets.zylem.cloud',
				changeOrigin: true,
				secure: true,
				agent: cdnProxyAgent,
				rewrite: (urlPath) => urlPath.replace(/^\/cdn/, ''),
			},
		},
	},
	preview: {
		allowedHosts,
	},
	// Resolve paths relative to the package root where index.html is
	root: __dirname,
});
