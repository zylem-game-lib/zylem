import { BaseNode } from '../base-node';
import { DestroyFunction, SetupContext, SetupFunction, UpdateFunction } from '../base-node-life-cycle';
import { StageOptions, ZylemStage } from './zylem-stage';
import { ZylemCamera } from '../../camera/zylem-camera';
import { CameraWrapper } from '../../camera/camera';
export declare class Stage {
    stageRef: ZylemStage | null;
    options: StageOptions;
    update: UpdateFunction<ZylemStage>;
    setup: SetupFunction<ZylemStage>;
    destroy: DestroyFunction<ZylemStage>;
    constructor(options: StageOptions);
    load(id: string, camera?: ZylemCamera | CameraWrapper | null): Promise<void>;
    addEntities(entities: BaseNode[]): Promise<void>;
    start(params: SetupContext<ZylemStage>): void;
}
/**
 * Create a stage with optional camera
 */
export declare function stage(...options: StageOptions): Stage;
