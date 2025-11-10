import { Color, Vector3 } from 'three';
import { ZylemWorld } from '../collision/world';
import { ZylemScene } from '../graphics/zylem-scene';
import { GameEntityInterface } from '../types/entity-types';
import { SetupContext, UpdateContext, DestroyContext } from '../core/base-node-life-cycle';
import { LifeCycleBase } from '../core/lifecycle-base';
import { BaseNode } from '../core/base-node';
import { Stage } from './stage';
import { CameraWrapper } from '../camera/camera';
import { StageDebugDelegate } from './stage-debug-delegate';
import { StageCameraDebugDelegate } from './stage-camera-debug-delegate';
import { BaseEntityInterface } from '../types/entity-types';
import { ZylemCamera } from '../camera/zylem-camera';
export interface ZylemStageConfig {
    inputs: Record<string, string[]>;
    backgroundColor: Color | string;
    backgroundImage: string | null;
    gravity: Vector3;
    variables: Record<string, any>;
    stageRef?: Stage;
}
type NodeLike = {
    create: Function;
};
export type StageEntityInput = NodeLike | Promise<any> | (() => NodeLike | Promise<any>);
export type StageOptionItem = Partial<ZylemStageConfig> | CameraWrapper | StageEntityInput;
export type StageOptions = [] | [Partial<ZylemStageConfig>, ...StageOptionItem[]];
export type StageState = ZylemStageConfig & {
    entities: GameEntityInterface[];
};
export declare const STAGE_TYPE = "Stage";
/**
 * ZylemStage orchestrates scene, physics world, entities, and lifecycle.
 *
 * Responsibilities:
 * - Manage stage configuration (background, inputs, gravity, variables)
 * - Initialize and own `ZylemScene` and `ZylemWorld`
 * - Spawn, track, and remove entities; emit entity-added events
 * - Drive per-frame updates and transform system
 */
export declare class ZylemStage extends LifeCycleBase<ZylemStage> {
    type: string;
    state: StageState;
    gravity: Vector3;
    world: ZylemWorld | null;
    scene: ZylemScene | null;
    children: Array<BaseNode>;
    _childrenMap: Map<number, BaseNode>;
    _removalMap: Map<number, BaseNode>;
    private pendingEntities;
    private pendingPromises;
    private isLoaded;
    _debugMap: Map<string, BaseNode>;
    private entityAddedHandlers;
    ecs: import("bitecs").IWorld;
    testSystem: any;
    transformSystem: any;
    debugDelegate: StageDebugDelegate | null;
    cameraDebugDelegate: StageCameraDebugDelegate | null;
    uuid: string;
    wrapperRef: Stage | null;
    camera?: CameraWrapper;
    cameraRef?: ZylemCamera | null;
    /**
     * Create a new stage.
     * @param options Stage options: partial config, camera, and initial entities or factories
     */
    constructor(options?: StageOptions);
    private parseOptions;
    private isZylemStageConfig;
    private isBaseNode;
    private isCameraWrapper;
    private isEntityInput;
    private isThenable;
    private handleEntityImmediatelyOrQueue;
    private handlePromiseWithSpawnOnResolve;
    private saveState;
    private setState;
    /**
     * Load and initialize the stage's scene and world.
     * @param id DOM element id for the renderer container
     * @param camera Optional camera override
     */
    load(id: string, camera?: ZylemCamera | null): Promise<void>;
    private createDefaultCamera;
    protected _setup(params: SetupContext<ZylemStage>): void;
    protected _update(params: UpdateContext<ZylemStage>): void;
    outOfLoop(): void;
    /** Update debug overlays and helpers if enabled. */
    debugUpdate(): void;
    /** Cleanup owned resources when the stage is destroyed. */
    protected _destroy(params: DestroyContext<ZylemStage>): void;
    /**
     * Create, register, and add an entity to the scene/world.
     * Safe to call only after `load` when scene/world exist.
     */
    spawnEntity(child: BaseNode): Promise<void>;
    buildEntityState(child: BaseNode): Partial<BaseEntityInterface>;
    /** Add the entity to internal maps and notify listeners. */
    addEntityToStage(entity: BaseNode): void;
    /**
     * Subscribe to entity-added events.
     * @param callback Invoked for each entity when added
     * @param options.replayExisting If true and stage already loaded, replays existing entities
     * @returns Unsubscribe function
     */
    onEntityAdded(callback: (entity: BaseNode) => void, options?: {
        replayExisting?: boolean;
    }): () => void;
    /**
     * Remove an entity and its resources by its UUID.
     * @returns true if removed, false if not found or stage not ready
     */
    removeEntityByUuid(uuid: string): boolean;
    /** Get an entity by its name; returns null if not found. */
    getEntityByName(name: string): BaseNode<any, any> | null;
    logMissingEntities(): void;
    /** Resize renderer viewport. */
    resize(width: number, height: number): void;
    /**
     * Enqueue items to be spawned. Items can be:
     * - BaseNode instances (immediate or deferred until load)
     * - Factory functions returning BaseNode or Promise<BaseNode>
     * - Promises resolving to BaseNode
     */
    enqueue(...items: StageEntityInput[]): void;
}
export {};
//# sourceMappingURL=zylem-stage.d.ts.map