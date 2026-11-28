import { CubeCamera, HalfFloatType, type CubeTexture, type Material, type Object3D } from 'three';
import {
	CubeRenderTarget, MeshBasicNodeMaterial, NodeUpdateType, RendererUtils, type NodeFrame,
} from 'three/webgpu';
import {
	cameraWorldMatrix, cubeTexture, materialColor, mix, normalWorld, positionViewDirection,
	reflectVector, vec3, vec4,
} from 'three/tsl';

interface CaptureOptions {
	/** Pixels per cube face. Default 128. Each capture renders six views. */
	resolution?: number;
	/** Display frames between captures. Default 1. */
	updateInterval?: number;
}

interface BubbleOptions extends CaptureOptions {
	type: 'bubble';
	/** Ratio of refractive indices at the surface. Default 1.02. */
	refractionRatio?: number;
	/** Fractional change in refraction ratio per color channel. Default 0.01. */
	dispersion?: number;
	/** Reflection at a front-facing surface. Default 0.1. */
	fresnelBias?: number;
	/** Strength of the increase in reflection toward the rim. Default 1. */
	fresnelScale?: number;
	/** Controls the width of the reflective rim. Default 2. */
	fresnelPower?: number;
}

/**
 * Live cube-map surfaces for mesh entities. The string forms use the defaults.
 * @see https://stemkoski.github.io/Three.js/Reflection.html
 * @see https://stemkoski.github.io/Three.js/Bubble.html
 */
export type EntityEnvironment = 'reflection' | 'bubble'
	| ({ type: 'reflection' } & CaptureOptions)
	| BubbleOptions;

export function usesEnvironmentMaterial(material: Material | Material[]): boolean {
	return Array.isArray(material)
		? material.some(slot => slot instanceof EntityEnvironmentMaterial)
		: material instanceof EntityEnvironmentMaterial;
}

const entityRoots = new WeakSet<Object3D>();

export function markEnvironmentCaptureRoot(root: Object3D): void {
	entityRoots.add(root);
}

function captureRoot(mesh: Object3D): Object3D {
	for (let node: Object3D | null = mesh; node; node = node.parent) {
		if (entityRoots.has(node)) return node;
	}
	return mesh;
}

// Cube captures can see other mirrors. Sample their last capture during this pass.
let capturing = false;

function bubbleColor(texture: CubeTexture, reflected: ReturnType<typeof cubeTexture>, options: BubbleOptions) {
	const incident = positionViewDirection.negate().transformDirection(cameraWorldMatrix);
	const ratio = options.refractionRatio ?? 1.02;
	const dispersion = options.dispersion ?? 0.01;
	const refractedSample = (eta: number) => {
		const ray = incident.refract(normalWorld, eta);
		// Total internal reflection produces a zero refraction vector.
		const direction = ray.dot(ray).greaterThan(0).select(ray, reflectVector);
		return cubeTexture(texture, direction);
	};
	const transmitted = vec3(
		refractedSample(ratio).r,
		refractedSample(ratio * (1 - dispersion)).g,
		refractedSample(ratio * (1 - 2 * dispersion)).b,
	);
	const rim = incident.dot(normalWorld).add(1).saturate();
	const fresnel = rim.pow(options.fresnelPower ?? 2)
		.mul(options.fresnelScale ?? 1).add(options.fresnelBias ?? 0.1).saturate();
	return mix(transmitted, reflected.rgb, fresnel);
}

export class EntityEnvironmentMaterial extends MeshBasicNodeMaterial {
	#options!: EntityEnvironment;
	#target?: CubeRenderTarget;
	#root?: Object3D;
	#lastFrame = -Infinity;
	#rendererState?: ReturnType<typeof RendererUtils.saveRendererState>;

	// Three constructs a material without arguments before calling copy() on clone.
	constructor(environment?: EntityEnvironment) {
		super();
		if (environment) this.configure(environment);
	}

	private configure(environment: EntityEnvironment): void {
		const options: Exclude<EntityEnvironment, string> = typeof environment === 'string'
			? { type: environment } : environment;
		const resolution = options.resolution ?? 128;
		const interval = options.updateInterval ?? 1;
		if (!Number.isInteger(resolution) || resolution < 1 || !Number.isInteger(interval) || interval < 1) {
			throw new RangeError('Environment resolution and updateInterval must be positive integers.');
		}

		this.#releaseCapture();
		this.#options = { ...options };
		const target = new CubeRenderTarget(resolution, { type: HalfFloatType });
		this.#target = target;
		const camera = new CubeCamera(0.1, 5000, target);
		const reflected = cubeTexture(target.texture, reflectVector);
		reflected.updateBeforeType = NodeUpdateType.FRAME;
		reflected.updateBefore = (frame) => this.capture(frame, camera, interval);
		const surface = options.type === 'bubble' ? bubbleColor(target.texture, reflected, options) : reflected.rgb;
		this.colorNode = vec4(surface.mul(materialColor.rgb), 1);
	}

	private capture({ renderer, scene, object, material, frameId }: NodeFrame, camera: CubeCamera, interval: number) {
		// Shadow/depth override materials can also evaluate the surface's alpha.
		if (material !== this || !renderer || !scene || !object) return false;
		const root = captureRoot(object);
		if (root !== this.#root) {
			this.#root?.removeEventListener('removed', this.#releaseCapture);
			this.#root = root;
			this.#lastFrame = -Infinity;
			root.addEventListener('removed', this.#releaseCapture);
		}
		if (capturing) return false;
		if (frameId >= this.#lastFrame && frameId - this.#lastFrame < interval) return;

		root.getWorldPosition(camera.position);
		const state = this.#rendererState ??= RendererUtils.saveRendererState(renderer);
		const xrEnabled = renderer.xr.enabled;
		const visible = root.visible;
		const materialVisible = this.visible;
		capturing = true;
		root.visible = false;
		this.visible = false;
		try {
			// A postprocessing pass may have MRT outputs or a custom draw function.
			RendererUtils.resetRendererState(renderer, state);
			camera.update(renderer, scene);
			this.#lastFrame = frameId;
		} finally {
			root.visible = visible;
			this.visible = materialVisible;
			capturing = false;
			renderer.xr.enabled = xrEnabled;
			RendererUtils.restoreRendererState(renderer, state);
		}
	}

	// A detached entity can be restored by editor undo or a stage reload.
	// Three re-allocates the target on its next capture.
	#releaseCapture = () => {
		this.#root?.removeEventListener('removed', this.#releaseCapture);
		this.#root = undefined;
		this.#lastFrame = -Infinity;
		this.#rendererState = undefined;
		this.#target?.dispose();
	};

	override copy(source: this): this {
		super.copy(source);
		this.configure(source.#options);
		return this;
	}

	override dispose(): void {
		this.#releaseCapture();
		super.dispose();
	}
}
