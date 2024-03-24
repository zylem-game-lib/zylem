import { ZylemWorld } from "../collision/world";
import { ZylemScene } from "../rendering/scene";
import { Entity, EntityBlueprint, UpdateFunction } from "../interfaces/entity";
import { Conditions, StageBlueprint } from "../interfaces/game";
import { BufferAttribute, BufferGeometry, LineBasicMaterial, LineSegments, Vector3 } from "three";
import {
	gameState,
	setGlobalState,
	setStagePerspective,
	setStageBackgroundColor,
	setStageBackgroundImage
} from "../state";
import { ZylemHUD } from "../ui/hud";
import { EntityParameters } from "./entity";
import { World } from "@dimforge/rapier3d-compat";

export class ZylemStage implements Entity<ZylemStage> {
	type = 'Stage';
	_update: UpdateFunction<ZylemStage> | null;
	world: ZylemWorld | null;
	scene: ZylemScene | null;
	HUD: ZylemHUD | null;
	conditions: Conditions<any>[] = [];
	children: Array<Entity<any>> = [];
	_childrenMap: Map<string, Entity<any>> = new Map();
	blueprints: Array<EntityBlueprint<any>> = [];
	_debugLines: LineSegments | null = null;

	constructor() {
		this.world = null;
		this.scene = null;
		this.HUD = null;
		this._update = () => { };
	}

	async buildStage(options: StageBlueprint, id: string) {
		// TODO: consider moving globals out
		setStagePerspective(options.perspective);
		setStageBackgroundColor(options.backgroundColor);
		setStageBackgroundImage(options.backgroundImage);

		this.scene = new ZylemScene(id);
		this.scene._setup = options.setup;

		const physicsWorld = await ZylemWorld.loadPhysics(options.gravity ?? new Vector3(0, 0, 0));
		this.world = new ZylemWorld(physicsWorld);

		this._update = options.update ?? null;

		this.blueprints = options.children({ gameState, setGlobalState }) || [];
		this.conditions = options.conditions;
		await this.setup();
	}

	async setup() {
		if (!this.scene || !this.world) {
			this.logMissingEntities();
			return;
		}
		this.HUD = new ZylemHUD();
		this.HUD.createUI();
		this.scene.setup();
		for (let blueprint of this.blueprints) {
			await this.spawnEntity(blueprint, {});
		}
		this._debugLines = new LineSegments(
			new BufferGeometry(),
			new LineBasicMaterial({ vertexColors: true })
		);
		this.scene.scene.add(this._debugLines);
		this._debugLines.visible = true;
	}

	async spawnEntity(blueprint: EntityBlueprint<any>, options: any) {
		if (!this.scene || !this.world) {
			return;
		}

		const entity = await blueprint.createFromBlueprint();
		entity.name = blueprint.name;
		if (entity.group) {
			this.scene.scene.add(entity.group);
		}
		if (blueprint.props) {
			for (let key in blueprint.props) {
				entity[key] = blueprint.props[key];
			}
		}
		entity.stageRef = this;
		this.world.addEntity(entity);
		this.children.push(entity);
		this._childrenMap.set(entity.name, entity);
		if (blueprint.collision) {
			entity._collision = blueprint.collision;
		}
		if (blueprint.destroy) {
			entity._destroy = blueprint.destroy;
		}
		if (typeof blueprint.update !== 'function') {
			console.warn(`Entity ${blueprint.name} is missing an update function.`);
		}
		if (typeof blueprint.setup !== 'function') {
			console.warn(`Entity ${blueprint.name} is missing a setup function.`);
			return;
		}
		blueprint.setup({ entity });
	}

	destroy() {
		this.world?.destroy();
		this.scene?.destroy();
	}

	update(params: EntityParameters<ZylemStage>) {
		const { delta, entity, inputs, globals } = params;
		if (!this.scene || !this.world) {
			this.logMissingEntities();
			return;
		}
		this.world.update(params);
		for (let child of this.children) {
			child.update({
				delta,
				inputs,
				entity: child,
				globals: gameState.globals
			});
		}
		if (this._update) {
			this._update({
				delta,
				// camera: this.scene.zylemCamera,
				inputs,
				entity,
				globals: gameState.globals
			});
		}
		this.scene.update({
			delta,
			inputs,
			entity,
			globals: gameState.globals
		});
		this.debugStage(this.world.world);
	}

	debugStage(world: World) {
		if (!this._debugLines) {
			return;
		}
		const { vertices, colors } = world.debugRender();
		this._debugLines.geometry.setAttribute(
			"position",
			new BufferAttribute(vertices, 3),
		);
		this._debugLines.geometry.setAttribute(
			"color",
			new BufferAttribute(colors, 4),
		);
	}

	getEntityByName(name: string) {
		const entity = this._childrenMap.get(name);
		if (!entity) {
			console.warn(`Entity ${name} not found`);
		}
		return entity ?? null;
	}

	logMissingEntities() {
		console.warn("Zylem world or scene is null");
	}

	resize(width: number, height: number) {
		this.scene?.updateRenderer(width, height);
	}
}
