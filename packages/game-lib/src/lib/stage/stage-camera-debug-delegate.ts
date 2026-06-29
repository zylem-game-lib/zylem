/**
 * Adapter that lets the camera observe stage-level debug state.
 *
 * Implements the camera's `CameraDebugDelegate` contract by bridging the global
 * `debugState` and the stage's entity maps to the camera: it streams enabled /
 * selected-entity snapshots and resolves a selected entity's UUID into a
 * concrete Object3D the camera can frame. Exists so the camera stays decoupled
 * from stage internals while still being able to focus on debug selections.
 */
import { Object3D } from 'three';
import { subscribe } from 'valtio/vanilla';

import type { CameraDebugDelegate, CameraDebugState } from '../camera/zylem-camera';
import { debugState } from '../debug/debug-state';
import type { ZylemStage } from './zylem-stage';

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

