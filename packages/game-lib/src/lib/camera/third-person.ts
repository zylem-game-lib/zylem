import { Scene, Vector2, Vector3 } from 'three';
import { PerspectiveController, ZylemCamera } from './zylem-camera';
import { ZylemRenderer } from './renderer-manager';

/**
 * Third-person camera controller that supports multiple targets.
 *
 * - 0 targets: stays at configured position, looks at world origin
 * - 1 target: classic third-person follow (lerp to target + offset)
 * - 2+ targets: weighted-center framing -- computes centroid of all targets,
 *   zooms out based on max distance between them, and looks at centroid
 */
export class ThirdPersonCamera implements PerspectiveController {
	distance: Vector3;
	screenResolution: Vector2 | null = null;
	renderer: ZylemRenderer | null = null;
	scene: Scene | null = null;
	cameraRef: ZylemCamera | null = null;

	/** Padding multiplier when framing multiple targets. Higher = more zoom out. */
	paddingFactor = 1.5;

	/** Minimum camera distance when multi-framing (prevents extreme zoom-in). */
	minDistance = 5;

	/** Lerp factor for camera position smoothing. */
	lerpFactor = 0.1;

	constructor() {
		this.distance = new Vector3(0, 5, 8);
	}

	/**
	 * Setup the third person camera controller
	 */
	setup(params: { screenResolution: Vector2; renderer: ZylemRenderer; scene: Scene; camera: ZylemCamera }) {
		const { screenResolution, renderer, scene, camera } = params;
		this.screenResolution = screenResolution;
		this.renderer = renderer;
		this.scene = scene;
		this.cameraRef = camera;
	}

	/**
	 * Update the third person camera.
	 * Handles 0, 1, and multi-target scenarios.
	 */
	update(delta: number) {
		if (!this.cameraRef) return;

		const targets = this.cameraRef.targets;

		if (targets.length === 0) {
			// No targets: look at world origin, stay at current position
			this.cameraRef.camera.lookAt(new Vector3(0, 0, 0));
			return;
		}

		if (targets.length === 1) {
			// Single target: classic third-person follow
			this.updateSingleTarget(targets[0]);
			return;
		}

		// Multiple targets: weighted-center framing
		this.updateMultiTarget(targets);
	}

	/**
	 * Classic single-target follow: lerp to target position + offset, lookAt target.
	 */
	private updateSingleTarget(target: { group: { position: Vector3 } }) {
		const useTarget = target.group?.position || new Vector3(0, 0, 0);
		const desiredCameraPosition = useTarget.clone().add(this.distance);
		this.cameraRef!.camera.position.lerp(desiredCameraPosition, this.lerpFactor);
		this.cameraRef!.camera.lookAt(useTarget);
	}

	/**
	 * Multi-target framing: compute centroid, measure spread, zoom out to fit all.
	 */
	private updateMultiTarget(targets: Array<{ group: { position: Vector3 } }>) {
		// Compute centroid (average position of all targets)
		const centroid = new Vector3();
		for (const t of targets) {
			centroid.add(t.group.position);
		}
		centroid.divideScalar(targets.length);

		// Compute max distance from centroid to any target
		let maxDistFromCentroid = 0;
		for (const t of targets) {
			const dist = centroid.distanceTo(t.group.position);
			if (dist > maxDistFromCentroid) {
				maxDistFromCentroid = dist;
			}
		}

		// Scale the camera distance based on the spread of targets
		const dynamicDistance = Math.max(maxDistFromCentroid * this.paddingFactor, this.minDistance);

		// Compute desired camera position: centroid + offset direction scaled by dynamic distance
		const offsetDirection = this.distance.clone().normalize();
		const desiredCameraPosition = centroid.clone().add(
			offsetDirection.multiplyScalar(dynamicDistance)
		);

		// Preserve the vertical offset proportionally
		const baseLen = this.distance.length();
		if (baseLen > 0) {
			const heightRatio = this.distance.y / baseLen;
			desiredCameraPosition.y = centroid.y + dynamicDistance * heightRatio;
		}

		// Smooth camera movement
		this.cameraRef!.camera.position.lerp(desiredCameraPosition, this.lerpFactor);
		this.cameraRef!.camera.lookAt(centroid);
	}

	/**
	 * Handle resize events
	 */
	resize(width: number, height: number) {
		if (this.screenResolution) {
			this.screenResolution.set(width, height);
		}
	}

	/**
	 * Set the distance offset from the target
	 */
	setDistance(distance: Vector3) {
		this.distance = distance;
	}
}
