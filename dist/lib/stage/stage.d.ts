import { BaseNode } from '../core/base-node';
import { DestroyFunction, SetupContext, SetupFunction, UpdateFunction } from '../core/base-node-life-cycle';
import { StageOptionItem, StageOptions, ZylemStage } from './zylem-stage';
import { ZylemCamera } from '../camera/zylem-camera';
import { CameraWrapper } from '../camera/camera';
type NodeLike = {
    create: Function;
};
type AnyNode = NodeLike | Promise<NodeLike>;
type EntityInput = AnyNode | (() => AnyNode) | (() => Promise<any>);
export declare class Stage {
    wrappedStage: ZylemStage | null;
    options: StageOptionItem[];
    update: UpdateFunction<ZylemStage>;
    setup: SetupFunction<ZylemStage>;
    destroy: DestroyFunction<ZylemStage>;
    constructor(options: StageOptions);
    load(id: string, camera?: ZylemCamera | CameraWrapper | null): Promise<void>;
    addEntities(entities: BaseNode[]): Promise<void>;
    add(...inputs: Array<EntityInput>): void;
    start(params: SetupContext<ZylemStage>): void;
    onUpdate(...callbacks: UpdateFunction<ZylemStage>[]): void;
    onSetup(callback: SetupFunction<ZylemStage>): void;
    onDestroy(callback: DestroyFunction<ZylemStage>): void;
    setVariable(key: string, value: any): void;
    getVariable(key: string): any;
}
/**
 * Create a stage with optional camera
 */
export declare function stage(...options: StageOptions): Stage;
export {};
//# sourceMappingURL=stage.d.ts.map