import { Vector2, Vector3 } from "three";
import { PerspectiveType } from "./perspective";
import { RendererType, ZylemCamera } from "./zylem-camera";

export interface CameraOptions {
	perspective?: PerspectiveType;
	position?: Vector3;
	target?: Vector3;
	zoom?: number;
	screenResolution?: Vector2;
	/**
	 * Renderer type: 'auto' | 'webgpu' | 'webgl'
	 * Use 'webgpu' for TSL shaders
	 * @default 'webgl'
	 */
	rendererType?: RendererType;
}

export class CameraWrapper {
	cameraRef: ZylemCamera;

	constructor(camera: ZylemCamera) {
		this.cameraRef = camera;
	}
}

export function createCamera(options: CameraOptions): CameraWrapper {
	const screenResolution = options.screenResolution || new Vector2(window.innerWidth, window.innerHeight);
	let frustumSize = 10;
	if (options.perspective === 'fixed-2d') {
		frustumSize = options.zoom || 10;
	}
	const zylemCamera = new ZylemCamera(
		options.perspective || 'third-person',
		screenResolution,
		frustumSize,
		options.rendererType || 'webgl'
	);

	// Set initial position and target
	zylemCamera.move(options.position || new Vector3(0, 0, 0));
	zylemCamera.camera.lookAt(options.target || new Vector3(0, 0, 0));

	return new CameraWrapper(zylemCamera);
}