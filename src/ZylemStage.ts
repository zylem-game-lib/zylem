// Zylem Stage should combine a world with a scene
import { ZylemWorld } from "./world/ZylemWorld";
import { ZylemScene } from "./scene/ZylemScene";
import { Entity } from "./interfaces/Entity";

export class ZylemStage implements Entity {
	world: ZylemWorld;
	scene: ZylemScene;

	constructor(id: string, world?: ZylemWorld, scene?: ZylemScene) {
		this.world = world ?? new ZylemWorld();
		this.scene = scene ?? new ZylemScene(id);
	}

	setup() {
		this.world.setup();
		this.scene.setup();
	}
	destroy() {
		this.world.destroy();
		this.scene.destroy();
	}
	update(delta: number) {
		this.world.update(delta);
		this.scene.update(delta);
	}
}