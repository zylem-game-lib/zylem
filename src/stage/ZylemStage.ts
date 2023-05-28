// Zylem Stage should combine a world with a scene
import { ZylemWorld } from "../world/ZylemWorld";
import { ZylemScene } from "../scene/ZylemScene";
import { Entity, EntityBlueprint } from "../interfaces/Entity";
import { ZylemBox, ZylemSphere } from "./objects";
import { UpdateOptions } from "@/interfaces/Update";
import { Moveable } from "./objects/Moveable";
import { Interactive } from "./objects/Interactive";

export class ZylemStage implements Entity<ZylemStage> {
	_type = 'Stage';
	world: ZylemWorld;
	scene: ZylemScene;
	children: Array<Entity<any>> = [];
	blueprints: Array<EntityBlueprint<any>> = [];

	constructor(id: string, options: any) {
		this.world = new ZylemWorld();
		this.scene = new ZylemScene(id);
		this.blueprints = options.children() || [];
		this.setup();
	}

	setup() {
		this.world.setup();
		this.scene.setup();
		for (let blueprint of this.blueprints) {
			const BlueprintType = BlueprintMap[blueprint.type];
			const MoveableType = Moveable(BlueprintType);
			const InteractiveType = Interactive(MoveableType);

			const entity = new InteractiveType(blueprint);
			if (entity.mesh) {
				this.scene.scene.add(entity.mesh);
			}
			if (entity.body) {
				this.world.world.addBody(entity.body);
			}
			this.children.push(entity);
			if (typeof blueprint.update !== 'function') {
				console.warn(`Entity ${blueprint.name} is missing an update function.`);
			}
			if (typeof blueprint.setup !== 'function') {
				console.warn(`Entity ${blueprint.name} is missing a setup function.`);
				continue;
			}
			blueprint.setup(entity);
		}
	}

	destroy() {
		this.world.destroy();
		this.scene.destroy();
	}

	update(delta: number, options: UpdateOptions<Entity<any>>) {
		this.world.update(delta);
		for (let child of this.children) {
			child.update(delta, {
				inputs: options.inputs,
				entity: child,
			});
		}
		this.scene.update(delta);
	}
}

const BlueprintMap = {
	'Box': ZylemBox,
	'Sphere': ZylemSphere,
}
