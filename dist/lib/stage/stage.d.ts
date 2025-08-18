import { BaseNode } from '../core/base-node';
import { DestroyFunction, SetupContext, SetupFunction, UpdateFunction } from '../core/base-node-life-cycle';
import { StageOptions, ZylemStage } from './zylem-stage';
import { ZylemCamera } from '../camera/zylem-camera';
import { CameraWrapper } from '../camera/camera';
export declare class Stage {
    stageRef: ZylemStage;
    options: StageOptions;
    update: UpdateFunction<ZylemStage>;
    setup: SetupFunction<ZylemStage>;
    destroy: DestroyFunction<ZylemStage>;
    constructor(options: StageOptions);
    load(id: string, camera?: ZylemCamera | CameraWrapper | null): Promise<void>;
    addEntities(entities: BaseNode[]): Promise<void>;
    add(...inputs: Array<BaseNode | Promise<BaseNode> | (() => BaseNode) | (() => Promise<BaseNode>)>): void;
    start(params: SetupContext<ZylemStage>): void;
    onUpdate(...callbacks: UpdateFunction<ZylemStage>[]): void;
    onSetup(callback: SetupFunction<ZylemStage>): void;
    onDestroy(callback: DestroyFunction<ZylemStage>): void;
    setVariable(key: string, value: any): void;
    getVariable(key: string): any;
    watchVariable(key: string, callback: (value: any) => void): void;
}
/**
 * Create a stage with optional camera
 */
export declare function stage(...options: StageOptions): Stage;
