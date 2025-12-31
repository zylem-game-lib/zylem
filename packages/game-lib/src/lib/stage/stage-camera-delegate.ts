import { Vector2 } from 'three';
import { ZylemCamera } from '../camera/zylem-camera';
import { Perspectives, PerspectiveType } from '../camera/perspective';
import { CameraWrapper } from '../camera/camera';
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
}
