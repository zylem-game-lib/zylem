// Zylem Stage should combine a world with a scene
import { ZylemWorld } from "../world/ZylemWorld";
import { ZylemScene } from "../scene/ZylemScene";
import { Entity, EntityBlueprint } from "../interfaces/Entity";
import { ZylemBox } from "./objects";

export class ZylemStage implements Entity<ZylemStage> {
	type = 'Stage';
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
			// TODO: This should be a factory
			const entity = new ZylemBox({});
			if (entity.mesh) {
				this.scene.scene.add(entity.mesh);
			}
			if (entity.body) {
				this.world.world.addBody(entity.body);
			}
			this.children.push(entity);
			blueprint.setup(entity);
		}
	}

	destroy() {
		this.world.destroy();
		this.scene.destroy();
	}

	update(delta: number) {
		this.world.update(delta);
		for (let child of this.children) {
			child.update(delta);
		}
		this.scene.update(delta);
	}
}