import { EntityClass, EntityOptions, GameEntity } from '@/interfaces/Entity';
import { RigidBody } from '@dimforge/rapier3d-compat';
import { BoxGeometry, Mesh, MeshStandardMaterial, Vector3 } from 'three';

// Box is a combination of a 3D mesh and a physics body
export class ZylemBox extends EntityClass implements GameEntity<ZylemBox> {
	_type: string;
	mesh: Mesh;
	body: RigidBody;
	_update: (delta: number, options: any) => void;
	_setup: (entity: ZylemBox) => void;

	constructor(options: EntityOptions) {
		super();
		this._type = 'Box';
		this.mesh = this.createMesh(options.size);
		this.body = this.createBody(options.size);
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
		const { x, y, z } = this.body.translation();
		const { x: rx, y: ry, z: rz } = this.body.rotation();
		this.mesh.position.set(x, y, z);
		this.mesh.rotation.set(rx, ry, rz);
		const _inputs = inputs ?? { moveUp: false, moveDown: false };
		if (this._update === undefined) {
			return;
		}
		this._update(delta, { inputs: _inputs, entity: this });
	}

	createMesh(vector3: Vector3 | undefined = new Vector3(1, 1, 1)) {
		const geometry = new BoxGeometry(vector3.x, vector3.y, vector3.z);
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

	createBody(vector3: Vector3 | undefined = new Vector3(1, 1, 1)) {
		// const box = new Box(new Vec3(vector3.x / 2, vector3.y / 2, vector3.z / 2));
		// this.body = new Body({
		// 	mass: 0,
		// 	shape: box,
		// 	fixedRotation: true,
		// });
		// this.body.position.set(0, 0, 0);
		return this.body;
	}

}