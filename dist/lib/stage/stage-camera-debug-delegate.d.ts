import { Object3D } from 'three';
import type { CameraDebugDelegate, CameraDebugState } from '../camera/zylem-camera';
import type { ZylemStage } from './zylem-stage';
/**
 * Debug delegate that bridges the stage's entity map and debug state to the camera.
 */
export declare class StageCameraDebugDelegate implements CameraDebugDelegate {
    private stage;
    constructor(stage: ZylemStage);
    subscribe(listener: (state: CameraDebugState) => void): () => void;
    resolveTarget(uuid: string): Object3D | null;
    private snapshot;
}
//# sourceMappingURL=stage-camera-debug-delegate.d.ts.map