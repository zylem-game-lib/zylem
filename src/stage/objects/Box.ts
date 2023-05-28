import { Body, Box, Vec3 } from 'cannon-es';
import { EntityOptions, GameEntity } from '@/interfaces/Entity';
import { BoxGeometry, Mesh, MeshStandardMaterial } from 'three';

// Box is a combination of a 3D mesh and a physics body
export class ZylemBox implements GameEntity<ZylemBox> {
	_type: string;
	mesh: Mesh;
	body: Body;
	_update: (delta: number, options: any) => void;
	_setup: (entity: ZylemBox) => void;

	constructor(options: EntityOptions) {
		this._type = 'Box';
		this.mesh = this.createMesh();
		this.body = this.createBody();
		this._update = options.update;
		this._setup = options.setup;
	}

	setup() {
		this._setup(this);
	}

	destroy() { }

	update(delta: number, { inputs }: any) {
		if (!this.body) {
			return;
		}
		const { x, y, z } = this.body.position;
		this.mesh.position.set(x, y, z);
		const _inputs = inputs ?? { moveUp: false, moveDown: false };
		if (this._update === undefined) {
			return;
		}
		this._update(delta, { inputs: _inputs, entity: this });
	}

	createMesh() {
		const geometry = new BoxGeometry(2, 10, 1);
		const material = new MeshStandardMaterial({
			color: 0xFFFFFF,
			emissiveIntensity: 0.5,
			lightMapIntensity: 0.5,
			fog: true,
		});
		this.mesh = new Mesh(geometry, material);
		this.mesh.position.set(0, 0, 0);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;
		return this.mesh;
	}

	createBody() {
		const box = new Box(new Vec3(1, 1, 1));
		this.body = new Body({
			mass: 0,
			shape: box,
		});
		this.body.position.set(0, 0, 0);
		return this.body;
	}

}