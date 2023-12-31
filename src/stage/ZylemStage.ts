// Zylem Stage should combine a world with a scene
import { ZylemWorld } from "../world/ZylemWorld";
import { ZylemScene } from "../scene/ZylemScene";
import { Entity, EntityBlueprint } from "../interfaces/Entity";
import { ZylemBox, ZylemSphere, ZylemSprite } from "./objects";
import { UpdateOptions } from "../interfaces/Update";
import { Moveable } from "./objects/Moveable";
import { Interactive } from "./objects/Interactive";
import { gameState, setGameState, setStageState } from "../state";
import { Conditions, StageOptions } from "../interfaces/Game";
import { Vector3 } from "three";

export class ZylemStage implements Entity<ZylemStage> {
	_type = 'Stage';
	world: ZylemWorld | null;
	scene: ZylemScene | null;
	conditions: Conditions<any>[] = [];
	children: Array<Entity<any>> = [];
	blueprints: Array<EntityBlueprint<any>> = [];

	constructor() {
		this.world = null;
		this.scene = null;
	}

	async buildStage(options: StageOptions, id: string) {
		setStageState('perspective', options.perspective);
		setStageState('backgroundColor', options.backgroundColor);
		setStageState('backgroundImage', options.backgroundImage);
		this.scene = new ZylemScene(id);
		this.scene._setup = options.setup;
		const physicsWorld = await ZylemWorld.loadPhysics(options.gravity ?? new Vector3(0, 0, 0));
		this.world = new ZylemWorld(physicsWorld);
		this.blueprints = options.children({ gameState, setGameState }) || [];
		this.conditions = options.conditions;
		await this.setup();
	}

	async setup() {
		if (!this.scene || !this.world) {
			this.logMissingEntities();
			return;
		}
		this.scene.setup();
		for (let blueprint of this.blueprints) {
			this.spawnEntity(blueprint, {});
		}
	}

	spawnEntity(blueprint: EntityBlueprint<any>, options: any) {
		if (!this.scene || !this.world) {
			return;
		}
		const BlueprintType = BlueprintMap[blueprint.type];
		const MoveableType = Moveable(BlueprintType);
		const InteractiveType = Interactive(MoveableType);

		const entity = new InteractiveType(blueprint);
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
		blueprint.setup(entity);
	}

	destroy() {
		this.world?.destroy();
		this.scene?.destroy();
	}

	update(delta: number, options: UpdateOptions<Entity<any>>) {
		if (!this.scene || !this.world) {
			this.logMissingEntities();
			return;
		}
		this.world.update(delta);
		for (let child of this.children) {
			child.update(delta, {
				inputs: options.inputs,
				entity: child,
				globals: gameState.globals
			});
		}
		this.scene.update(delta);
	}

	logMissingEntities() {
		console.warn("Zylem world or scene is null");
	}

	resize(width: number, height: number) {
		this.scene?.updateRenderer(width, height);
	}
}

const BlueprintMap = {
	'Box': ZylemBox,
	'Sphere': ZylemSphere,
	'Sprite': ZylemSprite,
}
