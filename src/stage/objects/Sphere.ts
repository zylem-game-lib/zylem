// Sphere is a combination of a 3D mesh and a physics body
import { Mesh, MeshStandardMaterial, SphereGeometry } from 'three';
import { RigidBody } from '@dimforge/rapier3d-compat';
import { EntityClass, EntityOptions, GameEntity } from "@/interfaces/Entity";

export class ZylemSphere extends EntityClass implements GameEntity<ZylemSphere> {
	_type: string;
	mesh: Mesh;
	body: RigidBody;
	_update: (delta: number, options: any) => void;
	_setup: (entity: ZylemSphere) => void;

	constructor(options: EntityOptions) {
		super();
		this._type = 'Sphere';
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

	createMesh() {
		const geometry = new SphereGeometry(1);
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
		// const { world } = this.stageRef;
		// let colliderDesc = RAPIER.ColliderDesc.ball(radius);
		// colliderDesc.setSensor(isSensor);
		// world.createCollider(colliderDesc, this.body);

		return this.body;
	}
}