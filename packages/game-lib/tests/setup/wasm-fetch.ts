// Shared unit-test setup: serve vitest `/@fs/` asset URLs from disk.
//
// `@zylem/runtime` locates its bundled `zylem_runtime.wasm` with
// `new URL('./zylem_runtime.wasm', import.meta.url)`. Under vitest's module
// transform in a happy-dom environment that resolves to an
// `http://localhost:3000/@fs/<absolute path>` URL, which happy-dom's fetch
// tries (and fails) to retrieve over the network. Rewrite such fetches to a
// direct filesystem read so the real wasm integration tests can run.
const originalFetch = globalThis.fetch?.bind(globalThis);

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
	const url =
		typeof input === 'string'
			? input
			: input instanceof URL
				? input.href
				: input.url;
	const fsMatch = /\/@fs(\/.*)$/.exec(url);
	if (fsMatch) {
		const { readFile } = await import('node:fs/promises');
		const filePath = decodeURIComponent(fsMatch[1].split('?')[0]);
		const buf = await readFile(filePath);
		return new Response(new Uint8Array(buf), {
			status: 200,
			headers: { 'Content-Type': 'application/wasm' },
		});
	}
	if (!originalFetch) {
		throw new Error(`No fetch available for ${url}`);
	}
	return originalFetch(input as RequestInfo, init);
}) as typeof fetch;
