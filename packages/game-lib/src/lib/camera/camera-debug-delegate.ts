import { Object3D, Vector3, Quaternion, Camera } from 'three';
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

	constructor(camera: Camera, domElement: HTMLElement) {
		this.camera = camera;
		this.domElement = domElement;
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
			// Entering debug mode: save camera state
			this.saveCameraState();
			this.enableOrbitControls();
			this.updateOrbitTargetFromSelection(state.selected);
		} else if (!state.enabled && wasEnabled) {
			// Exiting debug mode: restore camera state
			this.orbitTarget = null;
			this.disableOrbitControls();
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
}
