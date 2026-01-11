import { Object3D, Vector3, Quaternion, Camera, Scene } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface CameraDebugState {
	enabled: boolean;
	selected: string[];
}

export interface CameraDebugDelegate {
	subscribe(listener: (state: CameraDebugState) => void): () => void;
	resolveTarget(uuid: string): Object3D | null;
}

/**
 * Manages orbit controls and debug state for a camera.
 * Orbit controls are only active when debug mode is enabled.
 */
export class CameraOrbitController {
	private camera: Camera;
	private domElement: HTMLElement;
	private cameraRig: Object3D | null = null;
	private sceneRef: Scene | null = null;
	
	private orbitControls: OrbitControls | null = null;
	private orbitTarget: Object3D | null = null;
	private orbitTargetWorldPos: Vector3 = new Vector3();

	private debugDelegate: CameraDebugDelegate | null = null;
	private debugUnsubscribe: (() => void) | null = null;
	private debugStateSnapshot: CameraDebugState = { enabled: false, selected: [] };

	// Saved camera state for restoration when exiting debug mode
	private savedCameraPosition: Vector3 | null = null;
	private savedCameraQuaternion: Quaternion | null = null;
	private savedCameraZoom: number | null = null;
	private savedCameraLocalPosition: Vector3 | null = null;

	// Saved debug camera state for restoration when re-entering debug mode
	private savedDebugCameraPosition: Vector3 | null = null;
	private savedDebugCameraQuaternion: Quaternion | null = null;
	private savedDebugCameraZoom: number | null = null;
	private savedDebugOrbitTarget: Vector3 | null = null;

	constructor(camera: Camera, domElement: HTMLElement, cameraRig?: Object3D | null) {
		this.camera = camera;
		this.domElement = domElement;
		this.cameraRig = cameraRig ?? null;
	}

	/**
	 * Set the scene reference for adding/removing camera when detaching from rig.
	 */
	setScene(scene: Scene | null): void {
		this.sceneRef = scene;
	}

	/**
	 * Check if debug mode is currently active (orbit controls enabled).
	 */
	get isActive(): boolean {
		return this.debugStateSnapshot.enabled;
	}

	/**
	 * Update orbit controls each frame.
	 * Should be called from the camera's update loop.
	 */
	update() {
		if (this.orbitControls && this.orbitTarget) {
			this.orbitTarget.getWorldPosition(this.orbitTargetWorldPos);
			this.orbitControls.target.copy(this.orbitTargetWorldPos);
		}
		this.orbitControls?.update();
	}

	/**
	 * Attach a delegate to react to debug state changes.
	 */
	setDebugDelegate(delegate: CameraDebugDelegate | null) {
		if (this.debugDelegate === delegate) {
			return;
		}
		this.detachDebugDelegate();
		this.debugDelegate = delegate;
		if (!delegate) {
			this.applyDebugState({ enabled: false, selected: [] });
			return;
		}
		const unsubscribe = delegate.subscribe((state) => {
			this.applyDebugState(state);
		});
		this.debugUnsubscribe = () => {
			unsubscribe?.();
		};
	}

	/**
	 * Clean up resources.
	 */
	dispose() {
		this.disableOrbitControls();
		this.detachDebugDelegate();
	}

	/**
	 * Get the current debug state snapshot.
	 */
	get debugState(): CameraDebugState {
		return this.debugStateSnapshot;
	}

	private applyDebugState(state: CameraDebugState) {
		const wasEnabled = this.debugStateSnapshot.enabled;
		this.debugStateSnapshot = {
			enabled: state.enabled,
			selected: [...state.selected],
		};
		if (state.enabled && !wasEnabled) {
			// Entering debug mode: save game camera state, detach from rig, restore debug camera state if available
			this.saveCameraState();
			this.detachCameraFromRig();
			this.enableOrbitControls();
			this.restoreDebugCameraState();
			this.updateOrbitTargetFromSelection(state.selected);
		} else if (!state.enabled && wasEnabled) {
			// Exiting debug mode: save debug camera state, then restore game camera state
			this.saveDebugCameraState();
			this.orbitTarget = null;
			this.disableOrbitControls();
			this.reattachCameraToRig();
			this.restoreCameraState();
		} else if (state.enabled) {
			// Still in debug mode, just update target
			this.updateOrbitTargetFromSelection(state.selected);
		}
	}

	private enableOrbitControls() {
		if (this.orbitControls) {
			return;
		}
		this.orbitControls = new OrbitControls(this.camera, this.domElement);
		this.orbitControls.enableDamping = true;
		this.orbitControls.dampingFactor = 0.05;
		this.orbitControls.screenSpacePanning = false;
		this.orbitControls.minDistance = 1;
		this.orbitControls.maxDistance = 500;
		this.orbitControls.maxPolarAngle = Math.PI / 2;
		// Default target to origin
		this.orbitControls.target.set(0, 0, 0);
	}

	private disableOrbitControls() {
		if (!this.orbitControls) {
			return;
		}
		this.orbitControls.dispose();
		this.orbitControls = null;
	}

	private updateOrbitTargetFromSelection(selected: string[]) {
		// Default to origin when no entity is selected
		if (!this.debugDelegate || selected.length === 0) {
			this.orbitTarget = null;
			if (this.orbitControls) {
				this.orbitControls.target.set(0, 0, 0);
			}
			return;
		}
		for (let i = selected.length - 1; i >= 0; i -= 1) {
			const uuid = selected[i];
			const targetObject = this.debugDelegate.resolveTarget(uuid);
			if (targetObject) {
				this.orbitTarget = targetObject;
				if (this.orbitControls) {
					targetObject.getWorldPosition(this.orbitTargetWorldPos);
					this.orbitControls.target.copy(this.orbitTargetWorldPos);
				}
				return;
			}
		}
		this.orbitTarget = null;
	}

	private detachDebugDelegate() {
		if (this.debugUnsubscribe) {
			try {
				this.debugUnsubscribe();
			} catch { /* noop */ }
		}
		this.debugUnsubscribe = null;
		this.debugDelegate = null;
	}

	/**
	 * Save camera position, rotation, and zoom before entering debug mode.
	 */
	private saveCameraState() {
		this.savedCameraPosition = this.camera.position.clone();
		this.savedCameraQuaternion = this.camera.quaternion.clone();
		// Save zoom for orthographic/perspective cameras
		if ('zoom' in this.camera) {
			this.savedCameraZoom = (this.camera as any).zoom as number;
		}
	}

	/**
	 * Restore camera position, rotation, and zoom when exiting debug mode.
	 */
	private restoreCameraState() {
		if (this.savedCameraPosition) {
			this.camera.position.copy(this.savedCameraPosition);
			this.savedCameraPosition = null;
		}
		if (this.savedCameraQuaternion) {
			this.camera.quaternion.copy(this.savedCameraQuaternion);
			this.savedCameraQuaternion = null;
		}
		if (this.savedCameraZoom !== null && 'zoom' in this.camera) {
			this.camera.zoom = this.savedCameraZoom;
			(this.camera as any).updateProjectionMatrix?.();
			this.savedCameraZoom = null;
		}
	}

	/**
	 * Save debug camera state when exiting debug mode.
	 */
	private saveDebugCameraState() {
		this.savedDebugCameraPosition = this.camera.position.clone();
		this.savedDebugCameraQuaternion = this.camera.quaternion.clone();
		if ('zoom' in this.camera) {
			this.savedDebugCameraZoom = (this.camera as any).zoom as number;
		}
		if (this.orbitControls) {
			this.savedDebugOrbitTarget = this.orbitControls.target.clone();
		}
	}

	/**
	 * Restore debug camera state when re-entering debug mode.
	 */
	private restoreDebugCameraState() {
		if (this.savedDebugCameraPosition) {
			this.camera.position.copy(this.savedDebugCameraPosition);
		}
		if (this.savedDebugCameraQuaternion) {
			this.camera.quaternion.copy(this.savedDebugCameraQuaternion);
		}
		if (this.savedDebugCameraZoom !== null && 'zoom' in this.camera) {
			this.camera.zoom = this.savedDebugCameraZoom;
			(this.camera as any).updateProjectionMatrix?.();
		}
		if (this.savedDebugOrbitTarget && this.orbitControls) {
			this.orbitControls.target.copy(this.savedDebugOrbitTarget);
		}
	}

	/**
	 * Detach camera from its rig to allow free orbit movement in debug mode.
	 * Preserves the camera's world position.
	 */
	private detachCameraFromRig(): void {
		if (!this.cameraRig || this.camera.parent !== this.cameraRig) {
			return;
		}

		// Save the camera's local position for later restoration
		this.savedCameraLocalPosition = this.camera.position.clone();

		// Get camera's world position before detaching
		const worldPos = new Vector3();
		this.camera.getWorldPosition(worldPos);

		// Remove camera from rig
		this.cameraRig.remove(this.camera);

		// Add camera directly to scene if scene ref is available
		if (this.sceneRef) {
			this.sceneRef.add(this.camera);
		}

		// Set camera's position to its previous world position
		this.camera.position.copy(worldPos);
	}

	/**
	 * Reattach camera to its rig when exiting debug mode.
	 * Restores the camera's local position relative to the rig.
	 */
	private reattachCameraToRig(): void {
		if (!this.cameraRig || this.camera.parent === this.cameraRig) {
			return;
		}

		// Remove camera from scene if it's there
		if (this.sceneRef && this.camera.parent === this.sceneRef) {
			this.sceneRef.remove(this.camera);
		}

		// Add camera back to rig
		this.cameraRig.add(this.camera);

		// Restore camera's local position
		if (this.savedCameraLocalPosition) {
			this.camera.position.copy(this.savedCameraLocalPosition);
			this.savedCameraLocalPosition = null;
		}
	}
}
