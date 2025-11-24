import { Scene, Vector2, WebGLRenderer } from 'three';
import { PerspectiveController, ZylemCamera } from './zylem-camera';

/**
 * Fixed 2D Camera Controller
 * Maintains a static 2D camera view with no automatic following or movement
 */
export class Fixed2DCamera implements PerspectiveController {
	screenResolution: Vector2 | null = null;
	renderer: WebGLRenderer | null = null;
	scene: Scene | null = null;
	cameraRef: ZylemCamera | null = null;

	constructor() {
		// Fixed 2D camera doesn't need any initial setup parameters
	}

	/**
	 * Setup the fixed 2D camera controller
	 */
	setup(params: { screenResolution: Vector2; renderer: WebGLRenderer; scene: Scene; camera: ZylemCamera }) {
		const { screenResolution, renderer, scene, camera } = params;
		this.screenResolution = screenResolution;
		this.renderer = renderer;
		this.scene = scene;
		this.cameraRef = camera;

		// Position camera for 2D view (looking down the Z-axis)
		this.cameraRef.camera.position.set(0, 0, 10);
		this.cameraRef.camera.lookAt(0, 0, 0);
	}

	/**
	 * Update the fixed 2D camera
	 * Fixed cameras don't need to update position/rotation automatically
	 */
	update(delta: number) {
		// Fixed 2D camera maintains its position and orientation
		// No automatic updates needed for a truly fixed camera
	}

	/**
	 * Handle resize events for 2D camera
	 */
	resize(width: number, height: number) {
		if (this.screenResolution) {
			this.screenResolution.set(width, height);
		}

		// For orthographic cameras, we might need to adjust the frustum
		// This is handled in the main ZylemCamera resize method
	}
}
