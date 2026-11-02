import type { AssetLoadOptions } from '../asset-types';

/**
 * Download a file once. When `Content-Length` is present, `onProgress`
 * receives the fraction of body bytes read. Parse failures are the caller's
 * problem: this function does not retry.
 */
export async function fetchBytes(url: string, options?: AssetLoadOptions): Promise<Uint8Array> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
	}

	const total = Number(response.headers.get('content-length'));
	if (!response.body || !Number.isFinite(total) || total <= 0) {
		const bytes = new Uint8Array(await response.arrayBuffer());
		options?.onProgress?.(1);
		return bytes;
	}

	const reader = response.body.getReader();
	const chunks: Uint8Array[] = [];
	let loaded = 0;
	while (true) {
		const { done, value } = await reader.read();
		if (done) {
			break;
		}
		if (!value) {
			continue;
		}
		chunks.push(value);
		loaded += value.byteLength;
		options?.onProgress?.(Math.min(1, loaded / total));
	}

	const bytes = new Uint8Array(loaded);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return bytes;
}

export async function fetchArrayBuffer(url: string, options?: AssetLoadOptions): Promise<ArrayBuffer> {
	const bytes = await fetchBytes(url, options);
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export async function fetchText(url: string, options?: AssetLoadOptions): Promise<string> {
	const bytes = await fetchBytes(url, options);
	return new TextDecoder().decode(bytes);
}
