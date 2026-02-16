import { Object3D } from 'three';
import { subscribe } from 'valtio/vanilla';

import type { CameraDebugDelegate, CameraDebugState } from '../camera/zylem-camera';
import { debugState } from '../debug/debug-state';
import type { ZylemStage } from './zylem-stage';

const cloneSelected = (selected: string[]): string[] => [...selected];

/**
 * Debug delegate that bridges the stage's entity map and debug state to the camera.
 */
export class StageCameraDebugDelegate implements CameraDebugDelegate {
	private stage: ZylemStage;

	constructor(stage: ZylemStage) {
		this.stage = stage;
	}

	subscribe(listener: (state: CameraDebugState) => void): () => void {
		const notify = () => listener(this.snapshot());
		notify();
		return subscribe(debugState, notify);
	}

	resolveTarget(uuid: string): Object3D | null {
		const entity: any = this.stage.entityDelegate.debugMap.get(uuid)
			|| this.stage.world?.collisionMap.get(uuid)
			|| null;
		const target = entity?.group ?? entity?.mesh ?? null;
		return target ?? null;
	}

	private snapshot(): CameraDebugState {
		return {
			enabled: debugState.enabled,
			selected: debugState.selectedEntity ? [debugState.selectedEntity.uuid] : [],
		};
	}
}

