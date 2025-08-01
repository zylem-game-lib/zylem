import { World } from '@dimforge/rapier3d-compat';
import { Color, LineSegments, Vector3 } from 'three';
import { ZylemWorld } from '../collision/world';
import { ZylemScene } from '../graphics/zylem-scene';
import { Conditions } from '../interfaces/game';
import { GameEntityInterface } from '../types/entity-types';
import { SetupContext, UpdateContext, DestroyContext } from '../core/base-node-life-cycle';
import { BaseNode } from '../core/base-node';
import { Stage } from './stage';
import { ZylemCamera } from '../camera/zylem-camera';
import { CameraWrapper } from '../camera/camera';
export interface ZylemStageConfig {
    inputs: Record<string, string[]>;
    backgroundColor: Color;
    backgroundImage: string | null;
    gravity: Vector3;
    variables: Record<string, any>;
    conditions?: Conditions<any>[];
    children?: ({ globals }: any) => BaseNode[];
    stageRef?: Stage;
}
export type StageOptions = Array<Partial<ZylemStageConfig> | BaseNode | CameraWrapper>;
export type StageState = ZylemStageConfig & {
    entities: GameEntityInterface[];
};
export declare const STAGE_TYPE = "Stage";
export declare class ZylemStage {
    type: string;
    state: StageState;
    gravity: Vector3;
    world: ZylemWorld | null;
    scene: ZylemScene | null;
    conditions: Conditions<any>[];
    children: Array<BaseNode>;
    _childrenMap: Map<string, BaseNode>;
    _removalMap: Map<string, BaseNode>;
    _debugLines: LineSegments | null;
    ecs: import("bitecs").IWorld;
    testSystem: any;
    transformSystem: any;
    uuid: string;
    wrapperRef: Stage | null;
    camera?: CameraWrapper;
    cameraRef?: ZylemCamera | null;
    _setup?: (params: SetupContext<ZylemStage>) => void;
    _update?: (params: UpdateContext<ZylemStage>) => void;
    _destroy?: (params: DestroyContext<ZylemStage>) => void;
    constructor(options?: StageOptions);
    /**
     * Parse the options array to extract config, entities, and camera
     */
    private parseOptions;
    /**
     * Type guard to check if an item is ZylemStageConfig
     */
    private isZylemStageConfig;
    /**
     * Type guard to check if an item is BaseNode
     */
    private isBaseNode;
    /**
     * Type guard to check if an item is CameraWrapper
     */
    private isCameraWrapper;
    private saveState;
    private setState;
    load(id: string, camera?: ZylemCamera | null): Promise<void>;
    private createDefaultCamera;
    setup(params: SetupContext<ZylemStage>): void;
    update(params: UpdateContext<ZylemStage>): void;
    destroy(params: DestroyContext<ZylemStage>): void;
    spawnEntity(child: BaseNode): Promise<void>;
    addEntityToStage(entity: BaseNode): void;
    debugStage(world: World): void;
    getEntityByName(name: string): BaseNode<any, any> | null;
    logMissingEntities(): void;
    resize(width: number, height: number): void;
}
