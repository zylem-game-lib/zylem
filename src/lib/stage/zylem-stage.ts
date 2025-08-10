import { addComponent, addEntity, createWorld as createECS } from 'bitecs';
import { Color, Vector3, Vector2 } from 'three';

import { ZylemWorld } from '../collision/world';
import { ZylemScene } from '../graphics/zylem-scene';

import { Conditions } from '../interfaces/game';
import { state } from '../game/game-state';
import { setStageBackgroundColor, setStageBackgroundImage } from './stage-state';

import { GameEntityInterface } from '../types/entity-types';
import { ZylemBlueColor } from '../core/utility';
import { debugState } from '../debug/debug-state';

import { SetupContext, UpdateContext, DestroyContext } from '../core/base-node-life-cycle';
import createTransformSystem, { StageSystem } from '../systems/transformable.system';
import { BaseNode } from '../core/base-node';
import { v4 as uuidv4 } from 'uuid';
import { Stage } from './stage';
import { ZylemCamera } from '../camera/zylem-camera';
import { Perspectives } from '../camera/perspective';
import { CameraWrapper } from '../camera/camera';
import { StageDebugDelegate } from './stage-debug-delegate';

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

export type StageState = ZylemStageConfig & { entities: GameEntityInterface[] };

export const STAGE_TYPE = 'Stage';

export class ZylemStage {
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
	conditions: Conditions<any>[] = [];

	children: Array<BaseNode> = [];
	_childrenMap: Map<string, BaseNode> = new Map();
	_removalMap: Map<string, BaseNode> = new Map();

	_debugMap: Map<string, BaseNode> = new Map();

	ecs = createECS();
	testSystem: any = null;
	transformSystem: any = null;
	debugDelegate: StageDebugDelegate | null = null;

	uuid: string;
	wrapperRef: Stage | null = null;
	camera?: CameraWrapper;
	cameraRef?: ZylemCamera | null = null;

	_setup?: (params: SetupContext<ZylemStage>) => void;
	_update?: (params: UpdateContext<ZylemStage>) => void;
	_destroy?: (params: DestroyContext<ZylemStage>) => void;

	constructor(options: StageOptions = []) {
		this.world = null;
		this.scene = null;
		this.uuid = uuidv4();

		// Parse the options array to extract different types of items
		const { config, entities, camera } = this.parseOptions(options);
		this.camera = camera;
		this.children = entities;
		this.saveState({
			backgroundColor: config.backgroundColor ?? this.state.backgroundColor,
			backgroundImage: config.backgroundImage ?? this.state.backgroundImage,
			inputs: config.inputs ?? this.state.inputs,
			gravity: config.gravity ?? this.state.gravity,
			variables: config.variables ?? this.state.variables,
			conditions: config.conditions,
			children: config.children,
			entities: []
		});

		this.gravity = config.gravity ?? new Vector3(0, 0, 0);
		this.conditions = config.conditions ?? [];

		// If children function is provided in config, merge with entities
		if (config.children) {
			const configChildren = config.children({ globals: state.globals });
			this.children = [...this.children, ...configChildren];
		}

		const self = this;
		window.onresize = function () {
			self.resize(window.innerWidth, window.innerHeight);
		};
	}

	/**
	 * Parse the options array to extract config, entities, and camera
	 */
	private parseOptions(options: StageOptions): {
		config: Partial<ZylemStageConfig>;
		entities: BaseNode[];
		camera?: CameraWrapper;
	} {
		let config: Partial<ZylemStageConfig> = {};
		const entities: BaseNode[] = [];
		let camera: CameraWrapper | undefined;
		for (const item of options) {
			if (this.isZylemStageConfig(item)) {
				config = { ...config, ...item };
			} else if (this.isBaseNode(item)) {
				entities.push(item);
			} else if (this.isCameraWrapper(item)) {
				camera = item;
			}
		}

		return { config, entities, camera };
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

	private saveState(state: StageState) {
		this.state = state;
	}

	private setState() {
		const { backgroundColor, backgroundImage } = this.state;
		setStageBackgroundColor(backgroundColor);
		setStageBackgroundImage(backgroundImage);
	}

	async load(id: string, camera?: ZylemCamera | null) {
		this.setState();

		const zylemCamera = camera || (this.camera ? this.camera.cameraRef : this.createDefaultCamera());
		this.cameraRef = zylemCamera;
		this.scene = new ZylemScene(id, zylemCamera, this.state);

		const physicsWorld = await ZylemWorld.loadPhysics(this.gravity ?? new Vector3(0, 0, 0));
		this.world = new ZylemWorld(physicsWorld);

		this.scene.setup();

		for (let child of this.children) {
			this.spawnEntity(child);
		}
		this.transformSystem = createTransformSystem(this as unknown as StageSystem);
	}

	private createDefaultCamera(): ZylemCamera {
		const width = window.innerWidth;
		const height = window.innerHeight;
		const screenResolution = new Vector2(width, height);
		return new ZylemCamera(Perspectives.ThirdPerson, screenResolution);
	}

	public setup(params: SetupContext<ZylemStage>): void {
		if (!this.scene || !this.world) {
			this.logMissingEntities();
			return;
		}
		if (debugState.on) {
			this.debugDelegate = new StageDebugDelegate(this);
		}
		if (this._setup) {
			this._setup({ ...params, me: this });
		}
	}

	public update(params: UpdateContext<ZylemStage>): void {
		const { delta } = params;
		if (!this.scene || !this.world) {
			this.logMissingEntities();
			return;
		}
		this.world.update(params);
		this.transformSystem(this.ecs);
		this._childrenMap.forEach((child, uuid) => {
			child.nodeUpdate({
				...params,
				me: child,
			});
		});
		if (this._update) {
			this._update({ ...params, me: this });
		}
		this.scene.update({ delta });
	}

	public debugUpdate() {
		if (debugState.on) {
			this.debugDelegate?.update();
		}
	}

	public destroy(params: DestroyContext<ZylemStage>): void {
		this.world?.destroy();
		this.scene?.destroy();
		this.debugDelegate?.dispose();

		if (this._destroy) {
			this._destroy({ ...params, me: this });
		}
	}

	async spawnEntity(child: BaseNode) {
		if (!this.scene || !this.world) {
			return;
		}
		const entity = child.create();
		const eid = addEntity(this.ecs);
		entity.eid = eid;
		this.scene.addEntity(entity);
		if (child.behaviors) {
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
			globals: {},
			camera: this.scene.zylemCamera,
		});
		this.addEntityToStage(entity);
	}

	addEntityToStage(entity: BaseNode) {
		this._childrenMap.set(`${entity.eid}-key`, entity);
		if (debugState.on) {
			this._debugMap.set(entity.uuid, entity);
		}
	}

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

		let foundKey: string | null = null;
		this._childrenMap.forEach((value, key) => {
			if ((value as any).uuid === uuid) {
				foundKey = key;
			}
		});
		if (foundKey) {
			this._childrenMap.delete(foundKey);
		}
		this._debugMap.delete(uuid);
		return true;
	}

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

	resize(width: number, height: number) {
		if (this.scene) {
			this.scene.updateRenderer(width, height);
		}
	}
}
