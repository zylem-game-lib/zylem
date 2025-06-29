import { addComponent, addEntity, createWorld as createECS } from 'bitecs';
import { World } from '@dimforge/rapier3d-compat';
import { BufferAttribute, BufferGeometry, Color, LineBasicMaterial, LineSegments, Vector3, Vector2 } from 'three';

import { ZylemWorld } from '../../collision/world';
import { ZylemScene } from '../../graphics/zylem-scene';

import { Conditions } from '../../interfaces/game';
import { state$ } from '../../state';
import { setEntitiesToStage, setStageBackgroundColor, setStageBackgroundImage } from '../../state/stage-state';

import { GameEntity } from '..';
import { ZylemBlueColor } from '../utility';
import { debugState } from '../../state/debug-state';

import { SetupContext, UpdateContext, DestroyContext } from '../base-node-life-cycle';
import createTransformSystem, { StageSystem } from '../../behaviors/transformable.system';
import { BaseNode } from '../base-node';
import { v4 as uuidv4 } from 'uuid';
import { Stage } from './stage';
import { ZylemCamera } from '~/lib/camera/zylem-camera';
import { Perspectives } from '~/lib/camera/perspective';
import { CameraWrapper } from '~/lib/camera/camera';

export interface ZylemStageConfig {
	inputs: Record<string, string[]>;
	backgroundColor: Color;
	backgroundImage: string | null;
	gravity: Vector3;
	variables: Record<string, any>;
	conditions?: Conditions<any>[];
	children?: ({ globals }: any) => BaseNode[];
}

export type StageOptions = Array<ZylemStageConfig | BaseNode | CameraWrapper>;

export type StageState = ZylemStageConfig & { entities: GameEntity<any>[] };

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

	_debugLines: LineSegments | null = null;

	ecs = createECS();
	testSystem: any = null;
	transformSystem: any = null;

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
			entities: this.state.entities,
		});

		this.gravity = config.gravity ?? new Vector3(0, 0, 0);
		this.conditions = config.conditions ?? [];

		// If children function is provided in config, merge with entities
		if (config.children) {
			const configChildren = config.children({ globals: state$.globals });
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

	/**
	 * Type guard to check if an item is ZylemStageConfig
	 */
	private isZylemStageConfig(item: any): item is ZylemStageConfig {
		return item && typeof item === 'object' && !(item instanceof BaseNode);
	}

	/**
	 * Type guard to check if an item is BaseNode
	 */
	private isBaseNode(item: any): item is BaseNode {
		return item && typeof item === 'object' && typeof item.create === 'function';
	}

	/**
	 * Type guard to check if an item is CameraWrapper
	 */
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
		this.scene = new ZylemScene(id, zylemCamera);

		const physicsWorld = await ZylemWorld.loadPhysics(this.gravity ?? new Vector3(0, 0, 0));
		this.world = new ZylemWorld(physicsWorld);

		this.scene.setup();

		for (let child of this.children) {
			this.spawnEntity(child);
		}
		setEntitiesToStage(this.children as unknown as GameEntity<any>[]);
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
			this._debugLines = new LineSegments(
				new BufferGeometry(),
				new LineBasicMaterial({ vertexColors: true })
			);
			this.scene.scene.add(this._debugLines);
			this._debugLines.visible = true;
		}
		if (this._setup) {
			this._setup({ ...params, entity: this, stage: this });
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
				entity: child,
			});
		});
		if (this._update) {
			this._update({ ...params, entity: this });
		}
		this.scene.update({ delta });
		if (debugState.on) {
			this.debugStage(this.world.world);
		}
	}

	public destroy(params: DestroyContext<ZylemStage>): void {
		this.world?.destroy();
		this.scene?.destroy();
		if (this._destroy) {
			this._destroy({ ...params, entity: this });
		}
	}

	async spawnEntity(child: BaseNode) {
		if (!this.scene || !this.world) {
			return;
		}
		const entity = child.create();
		const eid = addEntity(this.ecs);
		entity.eid = eid;
		if (entity.group) {
			this.scene.scene.add(entity.group);
		} else if (entity.mesh) {
			this.scene.scene.add(entity.mesh);
		}
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
			entity: child,
			globals: {},
			camera: this.scene.zylemCamera,
		});
		this.addEntityToStage(entity);
	}

	addEntityToStage(entity: BaseNode) {
		this._childrenMap.set(`${entity.eid}-key`, entity);
	}

	debugStage(world: World) {
		if (!this._debugLines) {
			return;
		}
		const { vertices, colors } = world.debugRender();
		this._debugLines.geometry.setAttribute(
			'position',
			new BufferAttribute(vertices, 3),
		);
		this._debugLines.geometry.setAttribute(
			'color',
			new BufferAttribute(colors, 4),
		);
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
