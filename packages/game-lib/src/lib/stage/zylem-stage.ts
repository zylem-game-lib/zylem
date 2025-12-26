import { addComponent, addEntity, createWorld as createECS, removeEntity } from 'bitecs';
import { Color, Vector3, Vector2 } from 'three';

import { ZylemWorld } from '../collision/world';
import { ZylemScene } from '../graphics/zylem-scene';
import { resetStageVariables, setStageBackgroundColor, setStageBackgroundImage, setStageVariables, clearVariables } from './stage-state';

import { GameEntityInterface } from '../types/entity-types';
import { ZylemBlueColor } from '../core/utility/vector';
import { debugState } from '../debug/debug-state';
import { subscribe } from 'valtio/vanilla';
import { getGlobals } from "../game/game-state";

import { SetupContext, UpdateContext, DestroyContext } from '../core/base-node-life-cycle';
import { LifeCycleBase } from '../core/lifecycle-base';
import createTransformSystem, { StageSystem } from '../systems/transformable.system';
import { BaseNode } from '../core/base-node';
import { nanoid } from 'nanoid';
import { Stage } from './stage';
import { Perspectives } from '../camera/perspective';
import { CameraWrapper } from '../camera/camera';
import { StageDebugDelegate } from './stage-debug-delegate';
import { StageCameraDebugDelegate } from './stage-camera-debug-delegate';
import { GameEntity } from '../entities/entity';
import { BaseEntityInterface } from '../types/entity-types';
import { ZylemCamera } from '../camera/zylem-camera';
import { LoadingEvent } from '../core/interfaces';
export type { LoadingEvent };

export interface ZylemStageConfig {
	inputs: Record<string, string[]>;
	backgroundColor: Color | string;
	backgroundImage: string | null;
	gravity: Vector3;
	variables: Record<string, any>;
	stageRef?: Stage;
}

type NodeLike = { create: Function };
export type StageEntityInput = NodeLike | Promise<any> | (() => NodeLike | Promise<any>);

export type StageOptionItem = Partial<ZylemStageConfig> | CameraWrapper | StageEntityInput;
export type StageOptions = [] | [Partial<ZylemStageConfig>, ...StageOptionItem[]];

export type StageState = ZylemStageConfig & { entities: GameEntityInterface[] };

const STAGE_TYPE = 'Stage';

/**
 * ZylemStage orchestrates scene, physics world, entities, and lifecycle.
 *
 * Responsibilities:
 * - Manage stage configuration (background, inputs, gravity, variables)
 * - Initialize and own `ZylemScene` and `ZylemWorld`
 * - Spawn, track, and remove entities; emit entity-added events
 * - Drive per-frame updates and transform system
 */
export class ZylemStage extends LifeCycleBase<ZylemStage> {
	public type = STAGE_TYPE;

	state: StageState = {
		backgroundColor: ZylemBlueColor,
		backgroundImage: null,
		inputs: {
			p1: ['gamepad-1', 'keyboard'],
			p2: ['gamepad-2', 'keyboard'],
		},
		gravity: new Vector3(0, 0, 0),
		variables: {},
		entities: [],
	};
	gravity: Vector3;

	world: ZylemWorld | null;
	scene: ZylemScene | null;

	children: Array<BaseNode> = [];
	_childrenMap: Map<number, BaseNode> = new Map();
	_removalMap: Map<number, BaseNode> = new Map();

	private pendingEntities: StageEntityInput[] = [];
	private pendingPromises: Promise<BaseNode>[] = [];
	private isLoaded: boolean = false;

	_debugMap: Map<string, BaseNode> = new Map();

	private entityAddedHandlers: Array<(entity: BaseNode) => void> = [];
	private loadingHandlers: Array<(event: LoadingEvent) => void> = [];


	ecs = createECS();
	testSystem: any = null;
	transformSystem: any = null;
	debugDelegate: StageDebugDelegate | null = null;
	cameraDebugDelegate: StageCameraDebugDelegate | null = null;
	private debugStateUnsubscribe: (() => void) | null = null;

	uuid: string;
	wrapperRef: Stage | null = null;
	camera?: CameraWrapper;
	cameraRef?: ZylemCamera | null = null;

	/**
	 * Create a new stage.
	 * @param options Stage options: partial config, camera, and initial entities or factories
	 */
	constructor(options: StageOptions = []) {
		super();
		this.world = null;
		this.scene = null;
		this.uuid = nanoid();

		// Parse the options array to extract different types of items
		const { config, entities, asyncEntities, camera } = this.parseOptions(options);
		this.camera = camera;
		this.children = entities;
		this.pendingEntities = asyncEntities;
		this.saveState({ ...this.state, ...config, entities: [] });

		this.gravity = config.gravity ?? new Vector3(0, 0, 0);

	}

	private parseOptions(options: StageOptions): {
		config: Partial<ZylemStageConfig>;
		entities: BaseNode[];
		asyncEntities: StageEntityInput[];
		camera?: CameraWrapper;
	} {
		let config: Partial<ZylemStageConfig> = {};
		const entities: BaseNode[] = [];
		const asyncEntities: StageEntityInput[] = [];
		let camera: CameraWrapper | undefined;
		for (const item of options) {
			if (this.isCameraWrapper(item)) {
				camera = item;
			} else if (this.isBaseNode(item)) {
				entities.push(item);
			} else if (this.isEntityInput(item)) {
				asyncEntities.push(item as StageEntityInput);
			} else if (this.isZylemStageConfig(item)) {
				config = { ...config, ...item };
			}
		}

		return { config, entities, asyncEntities, camera };
	}

	private isZylemStageConfig(item: any): item is ZylemStageConfig {
		return item && typeof item === 'object' && !(item instanceof BaseNode) && !(item instanceof CameraWrapper);
	}

	private isBaseNode(item: any): item is BaseNode {
		return item && typeof item === 'object' && typeof item.create === 'function';
	}

	private isCameraWrapper(item: any): item is CameraWrapper {
		return item && typeof item === 'object' && item.constructor.name === 'CameraWrapper';
	}

	private isEntityInput(item: any): item is StageEntityInput {
		if (!item) return false;
		if (this.isBaseNode(item)) return true;
		if (typeof item === 'function') return true;
		if (typeof item === 'object' && typeof (item as any).then === 'function') return true;
		return false;
	}

	private isThenable(value: any): value is Promise<any> {
		return !!value && typeof (value as any).then === 'function';
	}

	private handleEntityImmediatelyOrQueue(entity: BaseNode): void {
		if (this.isLoaded) {
			this.spawnEntity(entity);
		} else {
			this.children.push(entity);
		}
	}

	private handlePromiseWithSpawnOnResolve(promise: Promise<any>): void {
		if (this.isLoaded) {
			promise
				.then((entity) => this.spawnEntity(entity))
				.catch((e) => console.error('Failed to build async entity', e));
		} else {
			this.pendingPromises.push(promise as Promise<BaseNode>);
		}
	}

	private saveState(state: StageState) {
		this.state = state;
	}

	private setState() {
		const { backgroundColor, backgroundImage } = this.state;
		const color = backgroundColor instanceof Color ? backgroundColor : new Color(backgroundColor);
		setStageBackgroundColor(color);
		setStageBackgroundImage(backgroundImage);
		// Initialize reactive stage variables on load
		setStageVariables(this.state.variables ?? {});
	}

	/**
	 * Load and initialize the stage's scene and world.
	 * @param id DOM element id for the renderer container
	 * @param camera Optional camera override
	 */
	async load(id: string, camera?: ZylemCamera | null) {
		this.setState();

		const zylemCamera = camera || (this.camera ? this.camera.cameraRef : this.createDefaultCamera());
		this.cameraRef = zylemCamera;
		this.scene = new ZylemScene(id, zylemCamera, this.state);

		const physicsWorld = await ZylemWorld.loadPhysics(this.gravity ?? new Vector3(0, 0, 0));
		this.world = new ZylemWorld(physicsWorld);

		this.scene.setup();

		this.emitLoading({ type: 'start', message: 'Loading stage...', progress: 0 });

		const total = this.children.length + this.pendingEntities.length + this.pendingPromises.length;
		let current = 0;

		for (let child of this.children) {
			this.spawnEntity(child);
			current++;
			this.emitLoading({
				type: 'progress',
				message: `Loaded entity ${child.name || 'unknown'}`,
				progress: current / total,
				current,
				total
			});
		}
		if (this.pendingEntities.length) {
			this.enqueue(...this.pendingEntities);
			// enqueue handles spawning, but we might want to track progress here if we could
			// For now, let's just assume they are processed
			current += this.pendingEntities.length;
			this.pendingEntities = [];
		}
		if (this.pendingPromises.length) {
			for (const promise of this.pendingPromises) {
				promise.then((entity) => {
					this.spawnEntity(entity);
					// Note: this progress update might happen after 'complete' if we don't await, 
					// but load is async so we should probably await if we want accurate progress?
					// The original code didn't await.
				}).catch((e) => console.error('Failed to resolve pending stage entity', e));
			}
			// We are not awaiting promises here in original code, so we can't accurately track their completion for "progress" 
			// in a linear synchronous way. 
			// For now, let's just increment current count as if they are "scheduled"
			current += this.pendingPromises.length;
			this.pendingPromises = [];
		}
		this.transformSystem = createTransformSystem(this as unknown as StageSystem);
		this.isLoaded = true;
		this.emitLoading({ type: 'complete', message: 'Stage loaded', progress: 1 });
	}

	private createDefaultCamera(): ZylemCamera {
		const width = window.innerWidth;
		const height = window.innerHeight;
		const screenResolution = new Vector2(width, height);
		return new ZylemCamera(Perspectives.ThirdPerson, screenResolution);
	}

	protected _setup(params: SetupContext<ZylemStage>): void {
		if (!this.scene || !this.world) {
			this.logMissingEntities();
			return;
		}
		// Setup debug delegate based on current state
		this.updateDebugDelegate();

		// Subscribe to debugState changes for runtime toggle
		this.debugStateUnsubscribe = subscribe(debugState, () => {
			this.updateDebugDelegate();
		});
	}

	private updateDebugDelegate(): void {
		if (debugState.enabled && !this.debugDelegate && this.scene && this.world) {
			// Create debug delegate when debug is enabled
			this.debugDelegate = new StageDebugDelegate(this);
		} else if (!debugState.enabled && this.debugDelegate) {
			// Dispose debug delegate when debug is disabled
			this.debugDelegate.dispose();
			this.debugDelegate = null;
		}
	}

	protected _update(params: UpdateContext<ZylemStage>): void {
		const { delta } = params;
		if (!this.scene || !this.world) {
			this.logMissingEntities();
			return;
		}
		this.world.update(params);
		this.transformSystem(this.ecs);
		this._childrenMap.forEach((child, eid) => {
			child.nodeUpdate({
				...params,
				me: child,
			});
			if (child.markedForRemoval) {
				this.removeEntityByUuid(child.uuid);
			}
		});
		this.scene.update({ delta });
	}

	public outOfLoop() {
		this.debugUpdate();
	}

	/** Update debug overlays and helpers if enabled. */
	public debugUpdate() {
		if (debugState.enabled) {
			this.debugDelegate?.update();
		}
	}

	/** Cleanup owned resources when the stage is destroyed. */
	protected _destroy(params: DestroyContext<ZylemStage>): void {
		this._childrenMap.forEach((child) => {
			try { child.nodeDestroy({ me: child, globals: getGlobals() }); } catch { /* noop */ }
		});
		this._childrenMap.clear();
		this._removalMap.clear();
		this._debugMap.clear();

		this.world?.destroy();
		this.scene?.destroy();

		// Cleanup debug state subscription
		if (this.debugStateUnsubscribe) {
			this.debugStateUnsubscribe();
			this.debugStateUnsubscribe = null;
		}

		this.debugDelegate?.dispose();
		this.debugDelegate = null;
		this.cameraRef?.setDebugDelegate(null);
		this.cameraDebugDelegate = null;

		this.isLoaded = false;
		this.world = null as any;
		this.scene = null as any;
		this.cameraRef = null;
		// Clear reactive stage variables on unload
		resetStageVariables();
		// Clear object-scoped variables for this stage
		clearVariables(this);
	}

	/**
	 * Create, register, and add an entity to the scene/world.
	 * Safe to call only after `load` when scene/world exist.
	 */
	async spawnEntity(child: BaseNode) {
		if (!this.scene || !this.world) {
			return;
		}
		const entity = child.create();
		const eid = addEntity(this.ecs);
		entity.eid = eid;
		this.scene.addEntity(entity);
		// @ts-ignore
		if (child.behaviors) {
			// @ts-ignore
			for (let behavior of child.behaviors) {
				addComponent(this.ecs, behavior.component, entity.eid);
				const keys = Object.keys(behavior.values);
				for (const key of keys) {
					// @ts-ignore
					behavior.component[key][entity.eid] = behavior.values[key];
				}
			}
		}
		if (entity.colliderDesc) {
			this.world.addEntity(entity);
		}
		child.nodeSetup({
			me: child,
			globals: getGlobals(),
			camera: this.scene.zylemCamera,
		});
		this.addEntityToStage(entity);
	}

	buildEntityState(child: BaseNode): Partial<BaseEntityInterface> {
		if (child instanceof GameEntity) {
			return { ...child.buildInfo() } as Partial<BaseEntityInterface>;
		}
		return {
			uuid: child.uuid,
			name: child.name,
			eid: child.eid,
		} as Partial<BaseEntityInterface>;
	}

	/** Add the entity to internal maps and notify listeners. */
	addEntityToStage(entity: BaseNode) {
		this._childrenMap.set(entity.eid, entity);
		if (debugState.enabled) {
			this._debugMap.set(entity.uuid, entity);
		}
		for (const handler of this.entityAddedHandlers) {
			try {
				handler(entity);
			} catch (e) {
				console.error('onEntityAdded handler failed', e);
			}
		}
	}

	/**
	 * Subscribe to entity-added events.
	 * @param callback Invoked for each entity when added
	 * @param options.replayExisting If true and stage already loaded, replays existing entities
	 * @returns Unsubscribe function
	 */
	onEntityAdded(callback: (entity: BaseNode) => void, options?: { replayExisting?: boolean }) {
		this.entityAddedHandlers.push(callback);
		if (options?.replayExisting && this.isLoaded) {
			this._childrenMap.forEach((entity) => {
				try { callback(entity); } catch (e) { console.error('onEntityAdded replay failed', e); }
			});
		}
		return () => {
			this.entityAddedHandlers = this.entityAddedHandlers.filter((h) => h !== callback);
		};
	}

	onLoading(callback: (event: LoadingEvent) => void) {
		this.loadingHandlers.push(callback);
		return () => {
			this.loadingHandlers = this.loadingHandlers.filter((h) => h !== callback);
		};
	}

	private emitLoading(event: LoadingEvent) {
		this.loadingHandlers.forEach((h) => h(event));
	}

	/**
	 * Remove an entity and its resources by its UUID.
	 * @returns true if removed, false if not found or stage not ready
	 */
	removeEntityByUuid(uuid: string): boolean {
		if (!this.scene || !this.world) return false;
		// Try mapping via world collision map first for physics-backed entities
		// @ts-ignore - collisionMap is public Map<string, GameEntity<any>>
		const mapEntity = this.world.collisionMap.get(uuid) as any | undefined;
		const entity: any = mapEntity ?? this._debugMap.get(uuid);
		if (!entity) return false;

		this.world.destroyEntity(entity);

		if (entity.group) {
			this.scene.scene.remove(entity.group);
		} else if (entity.mesh) {
			this.scene.scene.remove(entity.mesh);
		}

		removeEntity(this.ecs, entity.eid);

		let foundKey: number | null = null;
		this._childrenMap.forEach((value, key) => {
			if ((value as any).uuid === uuid) {
				foundKey = key;
			}
		});
		if (foundKey !== null) {
			this._childrenMap.delete(foundKey);
		}
		this._debugMap.delete(uuid);
		return true;
	}

	/** Get an entity by its name; returns null if not found. */
	getEntityByName(name: string) {
		const arr = Object.entries(Object.fromEntries(this._childrenMap)).map((entry) => entry[1]);
		const entity = arr.find((child) => child.name === name);
		if (!entity) {
			console.warn(`Entity ${name} not found`);
		}
		return entity ?? null;
	}

	logMissingEntities() {
		console.warn('Zylem world or scene is null');
	}

	/** Resize renderer viewport. */
	resize(width: number, height: number) {
		if (this.scene) {
			this.scene.updateRenderer(width, height);
		}
	}

	/**
	 * Enqueue items to be spawned. Items can be:
	 * - BaseNode instances (immediate or deferred until load)
	 * - Factory functions returning BaseNode or Promise<BaseNode>
	 * - Promises resolving to BaseNode
	 */
	enqueue(...items: StageEntityInput[]) {
		for (const item of items) {
			if (!item) continue;
			if (this.isBaseNode(item)) {
				this.handleEntityImmediatelyOrQueue(item);
				continue;
			}
			if (typeof item === 'function') {
				try {
					const result = (item as (() => BaseNode | Promise<any>))();
					if (this.isBaseNode(result)) {
						this.handleEntityImmediatelyOrQueue(result);
					} else if (this.isThenable(result)) {
						this.handlePromiseWithSpawnOnResolve(result as Promise<any>);
					}
				} catch (error) {
					console.error('Error executing entity factory', error);
				}
				continue;
			}
			if (this.isThenable(item)) {
				this.handlePromiseWithSpawnOnResolve(item as Promise<any>);
			}
		}
	}
}
