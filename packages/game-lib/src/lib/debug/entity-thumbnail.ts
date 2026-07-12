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

export interface EntityThumbnailResult {
	dataUrl: string;
	bounds: Pick<ObjectBounds, 'width' | 'height' | 'depth'>;
}

export interface EntityThumbnailCacheEntry extends EntityThumbnailResult {
	uuid: string;
}

const DEFAULT_SIZE = 128;

/**
 * Generates and caches entity thumbnail previews for the editor entity list.
 * Renders a cloned Object3D into an offscreen RenderTarget on the shared WebGPU renderer.
 */
export class EntityThumbnailCache {
	private cache = new Map<string, EntityThumbnailCacheEntry>();
	private inFlight = new Map<string, Promise<EntityThumbnailCacheEntry | null>>();
	private renderer: WebGPURenderer | null = null;
	private size: number;

	constructor(size = DEFAULT_SIZE) {
		this.size = size;
	}

	setRenderer(renderer: WebGPURenderer | null): void {
		this.renderer = renderer;
	}

	get(uuid: string): EntityThumbnailCacheEntry | null {
		return this.cache.get(uuid) ?? null;
	}

	invalidate(uuid: string): void {
		this.cache.delete(uuid);
		this.inFlight.delete(uuid);
	}

	clear(): void {
		this.cache.clear();
		this.inFlight.clear();
	}

	/**
	 * Return a cached thumbnail or generate one asynchronously.
	 */
	async ensure(
		uuid: string,
		object: Object3D | null | undefined,
	): Promise<EntityThumbnailCacheEntry | null> {
		const cached = this.cache.get(uuid);
		if (cached) return cached;

		const pending = this.inFlight.get(uuid);
		if (pending) return pending;

		if (!object || !this.renderer) {
			return null;
		}

		const task = this.render(uuid, object)
			.then((result) => {
				this.inFlight.delete(uuid);
				if (!result) return null;
				this.cache.set(uuid, result);
				return result;
			})
			.catch((error) => {
				this.inFlight.delete(uuid);
				console.warn('EntityThumbnailCache: failed to render thumbnail', uuid, error);
				return null;
			});

		this.inFlight.set(uuid, task);
		return task;
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

		const dataUrl = pixelsToDataUrl(buffer, this.size, this.size);
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

function pixelsToDataUrl(
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
