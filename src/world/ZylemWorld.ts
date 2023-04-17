import { Entity } from '../interfaces/Entity';
import * as CANNON from 'cannon-es';


export class ZylemWorld implements Entity {
	world?: CANNON.World;

	constructor() { }

	setup() {
		this.world = new CANNON.World({
			gravity: new CANNON.Vec3(0, -9.82, 0),
		});
	}

	destroy() { }

	update(delta: number) {
		if (!this.world) {
			return;
		}
		this.world.fixedStep();
	}
}