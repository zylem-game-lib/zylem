import { Vector2 } from 'three';
import { ZylemCamera } from '../camera/zylem-camera';
import { Perspectives } from '../camera/perspective';
import { CameraWrapper } from '../camera/camera';
import { CameraManager } from '../camera/camera-manager';
import type { ZylemStage } from './zylem-stage';

/**
 * Delegate for camera creation and management within a stage.
 * Accepts an injected stage reference for context.
 */
export class StageCameraDelegate {
	private stage: ZylemStage;

	constructor(stage: ZylemStage) {
		this.stage = stage;
	}

	/**
	 * Create a default third-person camera based on window size.
	 */
	createDefaultCamera(): ZylemCamera {
		const width = window.innerWidth;
		const height = window.innerHeight;
		const screenResolution = new Vector2(width, height);
		return new ZylemCamera(Perspectives.ThirdPerson, screenResolution);
	}

	/**
	 * Resolve the camera to use for the stage.
	 * Uses the provided camera, stage camera wrapper, or creates a default.
	 * 
	 * @param cameraOverride Optional camera override
	 * @param cameraWrapper Optional camera wrapper from stage options
	 * @returns The resolved ZylemCamera instance
	 */
	resolveCamera(cameraOverride?: ZylemCamera | null, cameraWrapper?: CameraWrapper): ZylemCamera {
		if (cameraOverride) {
			return cameraOverride;
		}
		if (cameraWrapper) {
			return cameraWrapper.cameraRef;
		}
		return this.createDefaultCamera();
	}

	/**
	 * Build a CameraManager from stage options.
	 * Supports single camera (backward compatible) and multiple cameras.
	 * 
	 * @param cameraOverride Optional camera override from game-level config
	 * @param cameraWrappers Camera wrappers from stage options (can be single or array)
	 * @returns A CameraManager populated with the resolved cameras
	 */
	buildCameraManager(
		cameraOverride?: ZylemCamera | null,
		...cameraWrappers: (CameraWrapper | undefined)[]
	): CameraManager {
		const manager = new CameraManager();

		// If there's a camera override, use it as the primary
		if (cameraOverride) {
			manager.addCamera(cameraOverride, cameraOverride.name || 'main');
			return manager;
		}

		// Add cameras from wrappers
		const validWrappers = cameraWrappers.filter((w): w is CameraWrapper => w !== undefined);

		if (validWrappers.length > 0) {
			for (const wrapper of validWrappers) {
				const cam = wrapper.cameraRef;
				manager.addCamera(cam, cam.name || undefined);
			}
		} else {
			// No cameras provided: create a default
			const defaultCam = this.createDefaultCamera();
			manager.addCamera(defaultCam, 'default');
		}

		return manager;
	}
}
