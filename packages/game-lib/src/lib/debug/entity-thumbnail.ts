import {
	DirectionalLight,
	Object3D,
	PerspectiveCamera,
	RenderTarget,
	Scene,
	Color,
	LinearFilter,
} from 'three';
import type { WebGPURenderer } from 'three/webgpu';
import { frameObject, type ObjectBounds } from './frame-object';
import { entityPayloadWorker } from '../bridge/entity-payload-worker';

export interface EntityThumbnailResult {
	/**
	 * Preview image URL. Blob URL when the payload worker is available
	 * (encoded off-thread), PNG data URL on the synchronous fallback path.
	 */
	dataUrl: string;
	bounds: Pick<ObjectBounds, 'width' | 'height' | 'depth'>;
}

export interface EntityThumbnailCacheEntry extends EntityThumbnailResult {
	uuid: string;
}

const DEFAULT_SIZE = 128;

/**
 * Maximum cached thumbnails. Each is a 128x128 PNG, so an unbounded cache in a
 * game that continuously spawns entities would grow memory for the life of the
 * page. Eviction is least-recently-used.
 */
const DEFAULT_MAX_ENTRIES = 256;

/**
 * Thumbnail renders share the renderer the game draws with, and each one ends
 * in a pixel readback that stalls the GPU pipeline. Running them one at a time
 * keeps a burst of spawns from serializing into a visible hitch.
 */
const MAX_CONCURRENT_RENDERS = 1;

/**
 * Cap on entities waiting for a thumbnail. A game spawning projectiles every
 * frame would otherwise build a queue it can never drain; the newest requests
 * are the ones worth keeping, so the oldest are dropped.
 */
const MAX_QUEUED_RENDERS = 32;

interface QueuedRender {
	uuid: string;
	object: Object3D;
	resolve: (result: EntityThumbnailCacheEntry | null) => void;
}

/**
 * Generates and caches entity thumbnail previews for the editor entity list.
 * Renders a cloned Object3D into an offscreen RenderTarget on the shared WebGPU renderer.
 */
export class EntityThumbnailCache {
	private cache = new Map<string, EntityThumbnailCacheEntry>();
	private inFlight = new Map<string, Promise<EntityThumbnailCacheEntry | null>>();
	private renderer: WebGPURenderer | null = null;
	private size: number;
	private maxEntries: number;
	private queue: QueuedRender[] = [];
	private activeRenders = 0;

	constructor(size = DEFAULT_SIZE, maxEntries = DEFAULT_MAX_ENTRIES) {
		this.size = size;
		this.maxEntries = maxEntries;
	}

	setRenderer(renderer: WebGPURenderer | null): void {
		this.renderer = renderer;
	}

	get(uuid: string): EntityThumbnailCacheEntry | null {
		const entry = this.cache.get(uuid);
		if (!entry) return null;
		this.touch(uuid, entry);
		return entry;
	}

	invalidate(uuid: string): void {
		const entry = this.cache.get(uuid);
		if (entry) revokeIfBlobUrl(entry.dataUrl);
		this.cache.delete(uuid);
		this.inFlight.delete(uuid);
		// Drop any queued render for an entity that no longer exists.
		this.queue = this.queue.filter((task) => {
			if (task.uuid !== uuid) return true;
			task.resolve(null);
			return false;
		});
	}

	clear(): void {
		this.cache.forEach((entry) => revokeIfBlobUrl(entry.dataUrl));
		this.cache.clear();
		this.inFlight.clear();
		for (const task of this.queue) task.resolve(null);
		this.queue = [];
	}

	/** Number of thumbnails currently cached. */
	get cacheSize(): number {
		return this.cache.size;
	}

	/** Entities waiting for a render slot. */
	get pendingCount(): number {
		return this.queue.length;
	}

	/**
	 * Return a cached thumbnail, or schedule one. Renders are throttled to
	 * {@link MAX_CONCURRENT_RENDERS} at a time behind a bounded queue, so a
	 * burst of spawns cannot flood the renderer with pixel readbacks.
	 */
	async ensure(
		uuid: string,
		object: Object3D | null | undefined,
	): Promise<EntityThumbnailCacheEntry | null> {
		const cached = this.cache.get(uuid);
		if (cached) {
			this.touch(uuid, cached);
			return cached;
		}

		const pending = this.inFlight.get(uuid);
		if (pending) return pending;

		if (!object || !this.renderer) {
			return null;
		}

		const task = new Promise<EntityThumbnailCacheEntry | null>((resolve) => {
			this.queue.push({ uuid, object, resolve });
			if (this.queue.length > MAX_QUEUED_RENDERS) {
				// Newest requests are the most likely to still be on screen, so
				// shed from the front.
				const dropped = this.queue.splice(
					0,
					this.queue.length - MAX_QUEUED_RENDERS,
				);
				for (const stale of dropped) {
					this.inFlight.delete(stale.uuid);
					stale.resolve(null);
				}
			}
			this.drainQueue();
		});

		this.inFlight.set(uuid, task);
		return task;
	}

	/** Start queued renders until the concurrency budget is spent. */
	private drainQueue(): void {
		while (
			this.activeRenders < MAX_CONCURRENT_RENDERS
			&& this.queue.length > 0
		) {
			const task = this.queue.shift();
			if (!task) return;
			this.activeRenders += 1;
			void this.render(task.uuid, task.object)
				.then((result) => {
					if (result) {
						this.cache.set(task.uuid, result);
						this.evictOverflow();
					}
					task.resolve(result);
				})
				.catch((error) => {
					console.warn(
						'EntityThumbnailCache: failed to render thumbnail',
						task.uuid,
						error,
					);
					task.resolve(null);
				})
				.finally(() => {
					this.activeRenders -= 1;
					this.inFlight.delete(task.uuid);
					this.drainQueue();
				});
		}
	}

	/** Move an entry to the end of the Map so it is evicted last. */
	private touch(uuid: string, entry: EntityThumbnailCacheEntry): void {
		this.cache.delete(uuid);
		this.cache.set(uuid, entry);
	}

	/** Evict least-recently-used entries down to the cap. */
	private evictOverflow(): void {
		while (this.cache.size > this.maxEntries) {
			const oldest = this.cache.keys().next();
			if (oldest.done) return;
			const entry = this.cache.get(oldest.value);
			if (entry) revokeIfBlobUrl(entry.dataUrl);
			this.cache.delete(oldest.value);
		}
	}

	private async render(
		uuid: string,
		object: Object3D,
	): Promise<EntityThumbnailCacheEntry | null> {
		const renderer = this.renderer;
		if (!renderer) return null;

		const thumbScene = new Scene();
		thumbScene.background = new Color(0x3a3a3a);

		const light = new DirectionalLight(0xffffff, 2);
		light.position.set(5, 10, 7);
		thumbScene.add(light);

		const clone = object.clone(true);
		// Normalize transform so framing is relative to the mesh itself
		clone.position.set(0, 0, 0);
		clone.rotation.set(0, 0, 0);
		clone.updateMatrixWorld(true);
		thumbScene.add(clone);

		const thumbCam = new PerspectiveCamera(50, 1, 0.1, 100);
		const bounds = frameObject(clone, thumbCam);

		const rt = new RenderTarget(this.size, this.size, {
			minFilter: LinearFilter,
			magFilter: LinearFilter,
		});

		const prevTarget = renderer.getRenderTarget();
		const prevScissor = renderer.getScissorTest();
		try {
			renderer.setScissorTest(false);
			renderer.setRenderTarget(rt);
			renderer.render(thumbScene, thumbCam);
		} finally {
			renderer.setRenderTarget(prevTarget);
			renderer.setScissorTest(prevScissor);
		}

		const buffer = await renderer.readRenderTargetPixelsAsync(
			rt,
			0,
			0,
			this.size,
			this.size,
		);

		rt.dispose();
		// Do not dispose geometries/materials — Object3D.clone shares them with the live entity.
		thumbScene.remove(clone);

		// Prefer the payload worker: pixel flip + PNG encode run off-thread and
		// the result is a compact blob URL. Fall back to the synchronous canvas
		// path (data URL) when workers/OffscreenCanvas are unavailable.
		const dataUrl =
			(await entityPayloadWorker.encodeThumbnail(buffer, this.size, this.size))
			?? pixelsToDataUrl(buffer, this.size, this.size);
		if (!dataUrl) return null;

		return {
			uuid,
			dataUrl,
			bounds: {
				width: bounds.width,
				height: bounds.height,
				depth: bounds.depth,
			},
		};
	}
}

/** Shared cache used by the running game to feed editor entity payloads. */
export const entityThumbnailCache = new EntityThumbnailCache();

function revokeIfBlobUrl(url: string): void {
	if (url.startsWith('blob:') && typeof URL !== 'undefined') {
		URL.revokeObjectURL(url);
	}
}

/**
 * Synchronous fallback: flip the bottom-up readback rows and encode a PNG
 * data URL on the main thread. Exported for unit tests.
 * @internal
 */
export function pixelsToDataUrl(
	buffer: ArrayBufferView,
	width: number,
	height: number,
): string | null {
	if (typeof document === 'undefined') return null;

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) return null;

	const src = buffer instanceof Uint8Array
		? buffer
		: new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

	const imageData = ctx.createImageData(width, height);
	// WebGPU/WebGL readback is bottom-up; flip vertically for canvas.
	for (let y = 0; y < height; y += 1) {
		const srcRow = (height - 1 - y) * width * 4;
		const dstRow = y * width * 4;
		imageData.data.set(src.subarray(srcRow, srcRow + width * 4), dstRow);
	}
	ctx.putImageData(imageData, 0, 0);
	return canvas.toDataURL('image/png');
}
