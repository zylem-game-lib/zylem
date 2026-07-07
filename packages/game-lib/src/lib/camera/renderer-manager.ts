import { Vector2, Scene, Camera, RenderTarget, HalfFloatType } from 'three';
import { WebGPURenderer, RenderPipeline } from 'three/webgpu';
import {
	pass,
	renderOutput,
	screenCoordinate,
	vec2,
	vec4,
	fract,
	sin,
	dot,
	texture as textureNode,
	uniform as uniformNode,
} from 'three/tsl';
import type { ZylemCamera } from './zylem-camera';
import { installThreeConsoleFilter } from '../graphics/three-console-filter';
import type { ResolvedStageTransition } from '../graphics/stage-transition';

/**
 * Renderer type option.
 *
 * @deprecated game-lib now always renders with WebGPU (Three.js
 * {@link WebGPURenderer}, which keeps its own internal WebGL2 fallback for
 * devices without WebGPU). This type is retained only so existing public
 * APIs (e.g. `CameraOptions.rendererType`) keep type-checking; the value is
 * ignored by the renderer.
 */
export type RendererType = 'auto' | 'webgpu' | 'webgl';

/**
 * The renderer instance type. game-lib standardizes on {@link WebGPURenderer}.
 */
export type ZylemRenderer = WebGPURenderer;

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
 * A postprocessing effect for the render pipeline. Receives the current
 * pipeline node (initially the scene pass) and returns the transformed node.
 * `ctx.scenePass` is the original scene `PassNode` for effects that need
 * extra channels (depth, velocity, ...). `ctx.scene`/`ctx.camera` are the
 * rendered scene and camera, for effects that build their own scene pass
 * (e.g. pixelation, retro). Such pass-replacing effects should be first in
 * the effect chain — the default scene pass simply goes unused.
 *
 * Structurally compatible with `ZylemPostEffect` from `@zylem/shaders`.
 */
export type ZylemPostEffect = (
	inputNode: any,
	ctx: { scenePass: any; scene: any; camera: any },
) => any;

/**
 * Internal state of an in-flight stage transition. The `fromNode` is a
 * display-space node for the outgoing stage's snapshot texture; progress is
 * driven by the render loop.
 */
interface ActiveStageTransition {
	resolved: ResolvedStageTransition;
	/** Float uniform node, 0..1 (eased). */
	progressUniform: { value: number };
	/** Display-space node for the outgoing frame. */
	fromNode: any;
	elapsed: number;
	snapshotTarget: RenderTarget | null;
	/**
	 * True once the transition has been composed into a pipeline via
	 * `setupPostProcessing`. Progress only advances after composition, so
	 * time spent loading the incoming stage does not eat into the blend.
	 */
	composed: boolean;
}

/**
 * Check if WebGPU is supported in the current browser.
 *
 * Informational only — game-lib always constructs a {@link WebGPURenderer},
 * which transparently falls back to a WebGL2 backend when the WebGPU adapter
 * is unavailable. Callers can use this to surface device capabilities.
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
 * RendererManager owns the shared WebGPU renderer, canvas element, the
 * optional post-processing pipeline, and the render loop. There is one
 * RendererManager per game.
 *
 * It iterates active cameras and renders each with its configured viewport.
 */
export class RendererManager {
	renderer!: ZylemRenderer;
	/**
	 * Optional TSL post-processing pipeline. Bound to a single fullscreen
	 * scene+camera via {@link setupPostProcessing}. When present and the
	 * frame is a single fullscreen viewport, the pipeline drives the final
	 * draw instead of `renderer.render(...)`.
	 */
	postProcessing: RenderPipeline | null = null;
	/**
	 * Supersampling (SSAA) multiplier for the scene pass. `1` renders at native
	 * resolution (default). Values > 1 render the scene pass larger and let the
	 * post pipeline downsample it, trading GPU cost for smoother shading/edges
	 * (this is what the legacy WebGL pipeline did implicitly). Applied on the
	 * next {@link setupPostProcessing}.
	 */
	renderScale = 1;
	screenResolution: Vector2;
	/**
	 * @deprecated Always `'webgpu'`. Retained for backward compatibility.
	 */
	rendererType: RendererType;
	private _initialized = false;
	private _sceneRef: Scene | null = null;
	private _lastAnimationTimestamp: number | null = null;
	/** Registered postprocessing effects, applied in order over the scene pass. */
	private _postEffects: ZylemPostEffect[] = [];
	/** Scene/camera the current pipeline was built for (for rebuilds). */
	private _postSceneRef: Scene | null = null;
	private _postCameraRef: Camera | null = null;
	/** In-flight stage transition, if any. */
	private _transition: ActiveStageTransition | null = null;

	constructor(screenResolution?: Vector2, _rendererType: RendererType = 'webgpu') {
		this.screenResolution = screenResolution || new Vector2(window.innerWidth, window.innerHeight);
		this.rendererType = 'webgpu';
	}

	/**
	 * Check if the renderer has been initialized
	 */
	get initialized(): boolean {
		return this._initialized;
	}

	/**
	 * Whether the active renderer is WebGPU. Always true; retained for
	 * backward compatibility with callers that branched on backend.
	 *
	 * @deprecated game-lib is WebGPU-only.
	 */
	get isWebGPU(): boolean {
		return true;
	}

	/**
	 * Initialize the renderer (must be called before rendering).
	 * Async because WebGPU requires async initialization.
	 *
	 * The renderer keeps Three.js's built-in WebGL2 fallback backend, so it
	 * still initializes on devices without native WebGPU.
	 */
	async initRenderer(): Promise<void> {
		if (this._initialized) return;

		// Filter the upstream per-frame "THREE.Abstract function." WebGPU
		// node-update warning before any frames render. See the helper for the
		// full rationale.
		installThreeConsoleFilter();

		this.renderer = new WebGPURenderer({ antialias: true, alpha: true });
		await this.renderer.init();

		this.renderer.setSize(this.screenResolution.x, this.screenResolution.y);
		this.renderer.shadowMap.enabled = true;

		this._initialized = true;
	}

	/**
	 * Set the current scene reference for rendering.
	 */
	setScene(scene: Scene): void {
		this._sceneRef = scene;
	}

	/**
	 * Set up the post-processing pipeline for a scene + camera.
	 *
	 * Builds a TSL `pass(scene, camera)` (HalfFloat + MSAA) and composes the
	 * final output ourselves so a display-space dither can be added: the dither
	 * breaks up 8-bit gradient banding (e.g. on terrain/sky) that the legacy
	 * WebGL pipeline hid via implicit supersampling. This is the WebGPU
	 * replacement for the old `EffectComposer` + `RenderPass`.
	 */
	setupPostProcessing(scene: Scene, camera: Camera): void {
		this.disposePostProcessing();
		this._postSceneRef = scene;
		this._postCameraRef = camera;
		const post = new RenderPipeline(this.renderer);
		const scenePass = pass(scene, camera);
		// Opt-in supersampling: render the pass larger and let it downsample.
		// `setResolutionScale` lives on the underlying PassNode; the
		// ShaderNodeObject proxy forwards the call at runtime but doesn't
		// surface it in its type.
		if (this.renderScale !== 1) {
			(scenePass as unknown as { setResolutionScale(n: number): void }).setResolutionScale(this.renderScale);
		}
		// Fold registered postprocessing effects over the scene pass, in order.
		let pipelineNode: any = scenePass;
		for (const effect of this._postEffects) {
			try {
				pipelineNode = effect(pipelineNode, { scenePass, scene, camera });
			} catch (error) {
				console.error('RendererManager: post-processing effect failed, skipping.', error);
			}
		}
		// Apply the output color transform ourselves (tone map + sRGB) so the
		// dither is added in display space, where it offsets by ~1 code value.
		post.outputColorTransform = false;
		let displayNode: any = renderOutput(pipelineNode);
		// While a stage transition is active, blend the outgoing frame
		// (display-space snapshot texture) into the incoming frame before
		// the dither.
		const transition = this._transition;
		if (transition) {
			try {
				displayNode = vec4(
					transition.resolved.shader({
						fromNode: transition.fromNode,
						toNode: displayNode,
						progress: transition.progressUniform,
					}),
				);
				transition.composed = true;
			} catch (error) {
				console.error('RendererManager: stage transition shader failed, skipping.', error);
			}
		}
		post.outputNode = displayNode.add(outputDitherNode());
		this.postProcessing = post;
	}

	// ─── Stage transitions ──────────────────────────────────────────────────

	/** Whether a stage transition is currently in flight. */
	get transitionActive(): boolean {
		return this._transition !== null;
	}

	/**
	 * Arm a stage transition: renders one final frame of the outgoing scene
	 * into a texture, to be blended with the incoming stage's frames once
	 * its pipeline is set up. Call before tearing down the outgoing stage.
	 */
	beginSnapshotTransition(resolved: ResolvedStageTransition, scene: Scene, camera: Camera): void {
		this.finishTransition();
		const size = new Vector2();
		this.renderer.getDrawingBufferSize(size);
		const target = new RenderTarget(Math.max(1, size.x), Math.max(1, size.y), {
			type: HalfFloatType,
		});
		const prevTarget = this.renderer.getRenderTarget();
		try {
			this.renderer.setScissorTest(false);
			this.renderer.setRenderTarget(target);
			this.renderer.render(scene, camera);
		} catch (error) {
			console.error('RendererManager: failed to capture transition snapshot.', error);
		} finally {
			this.renderer.setRenderTarget(prevTarget);
		}
		this._transition = {
			resolved,
			progressUniform: uniformNode(0),
			// Snapshot is linear (render-target output); apply the display
			// transform so it matches the incoming `renderOutput(...)` side.
			fromNode: renderOutput(textureNode(target.texture)),
			elapsed: 0,
			snapshotTarget: target,
			composed: false,
		};
	}

	/**
	 * Complete the active transition immediately: rebuild the normal
	 * pipeline, release transition resources, and fire `onComplete`.
	 * No-op when no transition is active.
	 */
	finishTransition(): void {
		const transition = this._transition;
		if (!transition) return;
		this._transition = null;
		transition.progressUniform.value = 1;
		// Rebuild the plain pipeline first so nothing references the
		// outgoing scene pass when `onComplete` tears the old stage down.
		if (this._postSceneRef && this._postCameraRef) {
			this.setupPostProcessing(this._postSceneRef, this._postCameraRef);
		}
		try {
			transition.resolved.onComplete?.();
		} catch (error) {
			console.error('RendererManager: transition onComplete failed.', error);
		}
		this.releaseTransitionResources(transition);
	}

	/**
	 * Drop the active transition without rebuilding the pipeline (renderer
	 * teardown path). Still fires `onComplete`.
	 */
	private cancelTransition(): void {
		const transition = this._transition;
		if (!transition) return;
		this._transition = null;
		try {
			transition.resolved.onComplete?.();
		} catch { /* noop */ }
		this.releaseTransitionResources(transition);
	}

	private releaseTransitionResources(transition: ActiveStageTransition): void {
		try {
			transition.snapshotTarget?.dispose();
		} catch { /* noop */ }
	}

	/** Advance transition progress; called once per render-loop frame. */
	private advanceTransition(delta: number): void {
		const transition = this._transition;
		if (!transition || !transition.composed) return;
		transition.elapsed += delta;
		const raw = Math.min(transition.elapsed / transition.resolved.duration, 1);
		transition.progressUniform.value = transition.resolved.easing(raw);
		if (raw >= 1) {
			this.finishTransition();
		}
	}

	/**
	 * Register postprocessing effects (e.g. from `@zylem/shaders`). Effects
	 * are applied in order between the scene pass and the display output
	 * transform. If a pipeline is already active it is rebuilt immediately;
	 * otherwise the effects apply on the next {@link setupPostProcessing}.
	 */
	setPostProcessingEffects(effects: ZylemPostEffect[]): void {
		this._postEffects = [...effects];
		if (this.postProcessing && this._postSceneRef && this._postCameraRef) {
			this.setupPostProcessing(this._postSceneRef, this._postCameraRef);
		}
	}

	/**
	 * Set the supersampling (SSAA) multiplier. Takes effect on the next
	 * {@link setupPostProcessing}. `1` = native resolution (default).
	 */
	setRenderScale(scale: number): void {
		this.renderScale = Math.max(1, Number.isFinite(scale) ? scale : 1);
	}

	/**
	 * Dispose the current post-processing pipeline, if any.
	 */
	private disposePostProcessing(): void {
		try {
			(this.postProcessing as any)?.dispose?.();
		} catch { /* noop */ }
		this.postProcessing = null;
	}

	/**
	 * Start the render loop. Calls the provided callback each frame.
	 */
	startRenderLoop(onFrame: (delta: number) => void): void {
		this._lastAnimationTimestamp = null;
		this.renderer.setAnimationLoop((timestamp: number) => {
			const deltaSeconds = this._lastAnimationTimestamp === null
				? 0
				: Math.max(0, (timestamp - this._lastAnimationTimestamp) / 1000);
			this._lastAnimationTimestamp = timestamp;
			this.advanceTransition(deltaSeconds);
			onFrame(deltaSeconds);
		});
	}

	/**
	 * Stop the render loop.
	 */
	stopRenderLoop(): void {
		this._lastAnimationTimestamp = null;
		try {
			this.renderer.setAnimationLoop(null as any);
		} catch { /* noop */ }
	}

	/**
	 * Render a scene from a single camera's perspective.
	 * Sets the viewport/scissor based on the camera's viewport config so
	 * split-screen / picture-in-picture layouts render to their region.
	 *
	 * @param usePostProcessing When true and a pipeline is configured, the
	 * post-processing pipeline drives the draw (fullscreen only).
	 */
	renderCamera(scene: Scene, camera: ZylemCamera, usePostProcessing = false): void {
		const vp = camera.viewport;
		const w = this.screenResolution.x;
		const h = this.screenResolution.y;

		const pixelX = Math.floor(vp.x * w);
		const pixelY = Math.floor(vp.y * h);
		const pixelW = Math.floor(vp.width * w);
		const pixelH = Math.floor(vp.height * h);

		this.renderer.setViewport(pixelX, pixelY, pixelW, pixelH);
		this.renderer.setScissor(pixelX, pixelY, pixelW, pixelH);
		this.renderer.setScissorTest(true);

		if (usePostProcessing && this.postProcessing) {
			this.postProcessing.render();
		} else {
			this.renderer.render(scene, camera.camera);
		}
	}

	/**
	 * Render a camera to its offscreen render target.
	 * Bypasses post-processing since render-to-texture output is consumed by
	 * an in-scene material (jumbotron / security-camera / portal effects).
	 *
	 * The camera must have a non-null renderTarget.
	 */
	renderCameraToTarget(scene: Scene, camera: ZylemCamera): void {
		if (!camera.renderTarget) return;

		const prevTarget = this.renderer.getRenderTarget();
		this.renderer.setScissorTest(false);
		this.renderer.setRenderTarget(camera.renderTarget);
		this.renderer.clear();
		this.renderer.render(scene, camera.camera);
		this.renderer.setRenderTarget(prevTarget);
	}

	/**
	 * Render a scene from multiple cameras, each with their own viewport.
	 * Cameras are rendered in order (first = bottom layer, last = top layer).
	 *
	 * Post-processing is applied only when there is a single fullscreen
	 * camera; split-screen layouts render directly per-viewport (a single
	 * fullscreen post pass cannot honor per-camera scissor regions).
	 */
	renderCameras(scene: Scene, cameras: ZylemCamera[]): void {
		if (!scene || cameras.length === 0) return;

		// Clear the full canvas first.
		this.renderer.setScissorTest(false);
		this.renderer.clear();

		const canPostProcess =
			cameras.length === 1 && isFullscreenViewport(cameras[0].viewport);

		for (const cam of cameras) {
			this.renderCamera(scene, cam, canPostProcess);
		}

		this.renderer.setScissorTest(false);
	}

	/**
	 * Simple single-camera render (backwards compatible).
	 * Uses post-processing when configured.
	 */
	render(scene: Scene, camera: Camera): void {
		if (this.postProcessing) {
			this.postProcessing.render();
		} else {
			this.renderer.render(scene, camera);
		}
	}

	/**
	 * Resize the renderer and update resolution.
	 */
	resize(width: number, height: number): void {
		this.screenResolution.set(width, height);
		this.renderer.setSize(width, height, false);
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
	 * Dispose renderer, post-processing, and related resources.
	 */
	dispose(): void {
		this.stopRenderLoop();
		this.cancelTransition();
		this.disposePostProcessing();
		try {
			this.renderer.dispose();
		} catch { /* noop */ }
		this._sceneRef = null;
		this._postSceneRef = null;
		this._postCameraRef = null;
		this._postEffects = [];
		this._initialized = false;
	}
}

/** Whether a viewport covers the entire canvas. */
function isFullscreenViewport(vp: Viewport): boolean {
	return vp.x === 0 && vp.y === 0 && vp.width === 1 && vp.height === 1;
}

/**
 * Triangular-PDF (TPDF) dither of ~+/-1 code value at 8-bit, keyed off pixel
 * coordinates. Added to the display-space output to break up gradient banding
 * before the canvas quantizes to 8-bit. Coordinate-based (not time-based) so
 * it stays static and does not shimmer between frames.
 */
function outputDitherNode() {
	const p = screenCoordinate.xy;
	const r1 = fract(sin(dot(p, vec2(12.9898, 78.233))).mul(43758.5453));
	const r2 = fract(
		sin(dot(p.add(vec2(13.0, 7.0)), vec2(12.9898, 78.233))).mul(43758.5453),
	);
	const tpdf = r1.sub(r2).mul(1.0 / 255.0);
	return vec4(tpdf, tpdf, tpdf, 0.0);
}
