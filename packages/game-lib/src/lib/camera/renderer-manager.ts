import { Vector2, WebGLRenderer, Scene, Camera, PerspectiveCamera } from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import RenderPass from '../graphics/render-pass';
import type { ZylemCamera } from './zylem-camera';

/**
 * Renderer type option for choosing rendering backend
 * - 'auto': Try WebGPU first, fall back to WebGL
 * - 'webgpu': Force WebGPU (error if not supported)
 * - 'webgl': Force WebGL
 */
export type RendererType = 'auto' | 'webgpu' | 'webgl';

/**
 * Union type for renderer instances
 */
export type ZylemRenderer = WebGLRenderer | WebGPURenderer;

/**
 * Viewport definition in normalized coordinates (0-1).
 * Represents a rectangular region of the canvas for camera rendering.
 */
export interface Viewport {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** Default fullscreen viewport */
export const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, width: 1, height: 1 };

/**
 * Check if WebGPU is supported in the current browser
 */
export async function isWebGPUSupported(): Promise<boolean> {
	if (!('gpu' in navigator)) return false;
	try {
		const adapter = await (navigator as any).gpu.requestAdapter();
		return adapter !== null;
	} catch {
		return false;
	}
}

/**
 * RendererManager owns the shared WebGL/WebGPU renderer, canvas element,
 * effect composer, and render loop. There is one RendererManager per game.
 *
 * It iterates active cameras and renders each with its configured viewport.
 */
export class RendererManager {
	renderer!: ZylemRenderer;
	composer!: EffectComposer;
	screenResolution: Vector2;
	rendererType: RendererType;
	private _isWebGPU = false;
	private _initialized = false;
	private _sceneRef: Scene | null = null;

	constructor(screenResolution?: Vector2, rendererType: RendererType = 'webgl') {
		this.screenResolution = screenResolution || new Vector2(window.innerWidth, window.innerHeight);
		this.rendererType = rendererType;
	}

	/**
	 * Check if the renderer has been initialized
	 */
	get initialized(): boolean {
		return this._initialized;
	}

	/**
	 * Check if using WebGPU renderer
	 */
	get isWebGPU(): boolean {
		return this._isWebGPU;
	}

	/**
	 * Initialize the renderer (must be called before rendering).
	 * Async because WebGPU requires async initialization.
	 */
	async initRenderer(): Promise<void> {
		if (this._initialized) return;

		let useWebGPU = false;

		if (this.rendererType === 'webgpu') {
			useWebGPU = true;
		} else if (this.rendererType === 'auto') {
			useWebGPU = await isWebGPUSupported();
		}

		if (useWebGPU) {
			try {
				this.renderer = new WebGPURenderer({ antialias: true });
				await this.renderer.init();
				this._isWebGPU = true;
				console.log('RendererManager: Using WebGPU renderer');
			} catch (e) {
				console.warn('RendererManager: WebGPU init failed, falling back to WebGL', e);
				this.renderer = new WebGLRenderer({ antialias: false, alpha: true });
				this._isWebGPU = false;
			}
		} else {
			this.renderer = new WebGLRenderer({ antialias: false, alpha: true });
			this._isWebGPU = false;
			console.log('RendererManager: Using WebGL renderer');
		}

		this.renderer.setSize(this.screenResolution.x, this.screenResolution.y);
		if (this.renderer instanceof WebGLRenderer) {
			this.renderer.shadowMap.enabled = true;
		}

		// Initialize composer (WebGPU uses different post-processing)
		if (!this._isWebGPU) {
			this.composer = new EffectComposer(this.renderer as WebGLRenderer);
		}

		this._initialized = true;
	}

	/**
	 * Set the current scene reference for rendering.
	 */
	setScene(scene: Scene): void {
		this._sceneRef = scene;
	}

	/**
	 * Setup post-processing render pass for a camera (WebGL only).
	 */
	setupRenderPass(scene: Scene, camera: Camera): void {
		if (this._isWebGPU || !this.composer) return;

		const renderResolution = this.screenResolution.clone().divideScalar(2);
		renderResolution.x |= 0;
		renderResolution.y |= 0;
		const pass = new RenderPass(renderResolution, scene, camera);
		this.composer.addPass(pass);
	}

	/**
	 * Start the render loop. Calls the provided callback each frame.
	 */
	startRenderLoop(onFrame: (delta: number) => void): void {
		this.renderer.setAnimationLoop((delta: number) => {
			onFrame(delta || 0);
		});
	}

	/**
	 * Stop the render loop.
	 */
	stopRenderLoop(): void {
		try {
			this.renderer.setAnimationLoop(null as any);
		} catch { /* noop */ }
	}

	/**
	 * Render a scene from a single camera's perspective.
	 * Sets the viewport based on the camera's viewport config.
	 */
	renderCamera(scene: Scene, camera: ZylemCamera): void {
		const vp = camera.viewport;
		const w = this.screenResolution.x;
		const h = this.screenResolution.y;

		// Set scissor and viewport for this camera
		const pixelX = Math.floor(vp.x * w);
		const pixelY = Math.floor(vp.y * h);
		const pixelW = Math.floor(vp.width * w);
		const pixelH = Math.floor(vp.height * h);

		if (this.renderer instanceof WebGLRenderer) {
			this.renderer.setViewport(pixelX, pixelY, pixelW, pixelH);
			this.renderer.setScissor(pixelX, pixelY, pixelW, pixelH);
			this.renderer.setScissorTest(true);
		}

		if (this._isWebGPU) {
			this.renderer.render(scene, camera.camera);
		} else if (this.composer) {
			this.composer.render(0);
		}
	}

	/**
	 * Render a scene from multiple cameras, each with their own viewport.
	 * Cameras are rendered in order (first = bottom layer, last = top layer).
	 */
	renderCameras(scene: Scene, cameras: ZylemCamera[]): void {
		if (!scene || cameras.length === 0) return;

		// Clear the full canvas first
		if (this.renderer instanceof WebGLRenderer) {
			this.renderer.setScissorTest(false);
			this.renderer.clear();
		}

		for (const cam of cameras) {
			this.renderCamera(scene, cam);
		}

		// Restore scissor test state
		if (this.renderer instanceof WebGLRenderer) {
			this.renderer.setScissorTest(false);
		}
	}

	/**
	 * Simple single-camera render (backwards compatible).
	 * Uses the full viewport for a single camera.
	 */
	render(scene: Scene, camera: Camera): void {
		if (this._isWebGPU) {
			this.renderer.render(scene, camera);
		} else if (this.composer) {
			this.composer.render(0);
		}
	}

	/**
	 * Resize the renderer and update resolution.
	 */
	resize(width: number, height: number): void {
		this.screenResolution.set(width, height);
		this.renderer.setSize(width, height, false);
		if (this.composer) {
			this.composer.setSize(width, height);
		}
	}

	/**
	 * Update renderer pixel ratio (DPR).
	 */
	setPixelRatio(dpr: number): void {
		const safe = Math.max(1, Number.isFinite(dpr) ? dpr : 1);
		this.renderer.setPixelRatio(safe);
	}

	/**
	 * Get the DOM element for the renderer.
	 */
	getDomElement(): HTMLCanvasElement {
		return this.renderer.domElement;
	}

	/**
	 * Dispose renderer, composer, and related resources.
	 */
	dispose(): void {
		this.stopRenderLoop();
		try {
			this.composer?.passes?.forEach((p: any) => p.dispose?.());
			(this.composer as any)?.dispose?.();
		} catch { /* noop */ }
		try {
			this.renderer.dispose();
		} catch { /* noop */ }
		this._sceneRef = null;
		this._initialized = false;
	}
}
