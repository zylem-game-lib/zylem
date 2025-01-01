import { addComponent, addEntity, createWorld as createECS } from 'bitecs';
import { World } from '@dimforge/rapier3d-compat';
import { BufferAttribute, BufferGeometry, Color, LineBasicMaterial, LineSegments, PerspectiveCamera, Vector3 } from 'three';

import { ZylemWorld } from '../collision/world';
import { ZylemScene } from '../graphics/scene';
import { Conditions } from '../interfaces/game';
import {
	setStagePerspective,
	setStageBackgroundColor,
	setStageBackgroundImage,
	state$
} from '../state';
import { ZylemHUD } from '../ui/hud';
import { GameEntity, StageEntity } from './';
import { PerspectiveType, Perspectives } from '../interfaces/perspective';
import { ZylemBlueColor } from './utility';
import { debugState } from '../state/debug-state';
import createTestSystem from '../behaviors/test-system';
import { applyMixins } from './composable';
import { SetupContext, UpdateContext, DestroyContext } from './base-node-life-cycle';
import createTransformSystem from '../behaviors/transformable';
import { BaseNode } from './base-node';

interface ZylemStageOptions {
	perspective: PerspectiveType;
	backgroundColor: Color;
	backgroundImage: String;
	gravity: Vector3;
	conditions: Conditions<any>[];
	children: ({ globals }: any) => BaseNode[];
}

export type StageOptions = Partial<ZylemStageOptions>;

export const STAGE_TYPE = 'Stage';

export class ZylemStage {
	public type = STAGE_TYPE;

	perspective: PerspectiveType;
	backgroundColor: Color;
	backgroundImage: String;
	gravity: Vector3;

	world: ZylemWorld | null;
	scene: ZylemScene | null;
	HUD: ZylemHUD;
	conditions: Conditions<any>[] = [];

	children: Array<BaseNode> = [];
	_childrenMap: Map<string, BaseNode> = new Map();
	_removalMap: Map<string, BaseNode> = new Map();

	_debugLines: LineSegments | null = null;

	ecs = createECS();
	testSystem: any = null;
	transformSystem: any = null;

	constructor(options: StageOptions) {
		this.world = null;
		this.scene = null;
		this.HUD = new ZylemHUD();
		this.perspective = options.perspective ?? Perspectives.ThirdPerson;
		this.backgroundColor = options.backgroundColor ?? ZylemBlueColor;
		this.backgroundImage = options.backgroundImage ?? '';
		this.gravity = options.gravity ?? new Vector3(0, 0, 0);
		this.children = options.children ? options.children({ globals: state$.globals }) : [];
		this.conditions = options.conditions ?? [];

		const self = this;
		window.onresize = function () {
			self.resize(window.innerWidth, window.innerHeight);
		};
	}

	async load(id: string) {
		// TODO: consider moving globals out
		setStagePerspective(this.perspective);
		setStageBackgroundColor(this.backgroundColor);
		setStageBackgroundImage(this.backgroundImage);

		this.scene = new ZylemScene(id);

		const physicsWorld = await ZylemWorld.loadPhysics(this.gravity ?? new Vector3(0, 0, 0));
		this.world = new ZylemWorld(physicsWorld);

		// this.HUD.createUI();

		this.scene.setup();

		for (let child of this.children) {
			this.spawnEntity(child);
		}
		this.testSystem = createTestSystem();
		this.transformSystem = createTransformSystem(this);
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
			this._setup({ ...params, HUD: this.HUD });
		}
	}

	public update(params: UpdateContext<ZylemStage>): void {
		const { delta } = params;
		if (!this.scene || !this.world) {
			this.logMissingEntities();
			return;
		}
		this.world.update(params);
		// ECS TEST
		this.testSystem(this.ecs);
		this.transformSystem(this.ecs);
		//
		this._childrenMap.forEach((child, uuid) => {
			const needsRemoval = this._removalMap.get(uuid);
			if (needsRemoval) {
				this._childrenMap.delete(uuid);
				this._removalMap.delete(uuid);
				return;
			}
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
		this._destroy({ ...params, entity: this });
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
		entity.stageRef = this;
		// if (child._custom) {
		// 	for (let key in child._custom) {
		// 		if (entity[key]) { continue; }
		// 		entity[key] = child._custom[key];
		// 	}
		// }
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
		this.world.addEntity(entity);
		child.nodeSetup({
			entity: child,
			globals: {},
			camera: this.scene.zylemCamera,
		});
		// TODO: string disk usage concerns?
		this._childrenMap.set(`${entity.eid}-key`, entity);
	}

	setForRemoval(entity: BaseNode & { eid, group }) {
		if (this.world) {
			this.world.setForRemoval(entity);
		}
		entity.group.clear();
		entity.group.removeFromParent();
		this._removalMap.set(`${entity.eid}-key`, entity);
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
			const camera = this.scene.zylemCamera.camera as PerspectiveCamera;
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			this.scene.updateRenderer(width, height);
		}
	}
}

export interface ZylemStage extends StageEntity, Lifecycle<ZylemStage> { }
applyMixins(ZylemStage, [StageEntity]);

export function stage(options: StageOptions = {}): ZylemStage {
	const zylemStage = new ZylemStage(options) as ZylemStage;
	return zylemStage;
}