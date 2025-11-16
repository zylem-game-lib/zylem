import { Scene, Vector2, Vector3, WebGLRenderer } from 'three';
import { PerspectiveController, ZylemCamera } from './zylem-camera';
import { StageEntity } from '../interfaces/entity';

interface ThirdPersonCameraOptions {
	target: StageEntity;
	distance: Vector3;
	screenResolution: Vector2;
	renderer: WebGLRenderer;
	scene: Scene;
}

export class ThirdPersonCamera implements PerspectiveController {
	distance: Vector3;
	screenResolution: Vector2 | null = null;
	renderer: WebGLRenderer | null = null;
	scene: Scene | null = null;
	cameraRef: ZylemCamera | null = null;

	constructor() {
		this.distance = new Vector3(0, 5, 8);
	}

	/**
	 * Setup the third person camera controller
	 */
	setup(params: { screenResolution: Vector2; renderer: WebGLRenderer; scene: Scene; camera: ZylemCamera }) {
		const { screenResolution, renderer, scene, camera } = params;
		this.screenResolution = screenResolution;
		this.renderer = renderer;
		this.scene = scene;
		this.cameraRef = camera;
	}

	/**
	 * Update the third person camera
	 */
	update(delta: number) {
		if (!this.cameraRef!.target) {
			return;
		}
		// TODO: Implement third person camera following logic
		const desiredCameraPosition = this.cameraRef!.target!.group.position.clone().add(this.distance);
		this.cameraRef!.camera.position.lerp(desiredCameraPosition, 0.1);
		this.cameraRef!.camera.lookAt(this.cameraRef!.target!.group.position);
	}

	/**
	 * Handle resize events
	 */
	resize(width: number, height: number) {
		if (this.screenResolution) {
			this.screenResolution.set(width, height);
		}
		// TODO: Handle any third-person specific resize logic
	}

	/**
	 * Set the distance from the target
	 */
	setDistance(distance: Vector3) {
		this.distance = distance;
	}
}