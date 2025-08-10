import { Vector3 } from 'three';
import { ZylemStage } from './zylem-stage';
export type AddEntityFactory = (params: {
    position: Vector3;
    normal?: Vector3;
}) => Promise<any> | any;
export interface StageDebugDelegateOptions {
    maxRayDistance?: number;
    addEntityFactory?: AddEntityFactory | null;
}
export declare class StageDebugDelegate {
    private stage;
    private options;
    private mouseNdc;
    private raycaster;
    private isMouseDown;
    private disposeFns;
    private debugCursor;
    private debugLines;
    constructor(stage: ZylemStage, options?: StageDebugDelegateOptions);
    update(): void;
    dispose(): void;
    private handleActionOnHit;
    private attachDomListeners;
}
