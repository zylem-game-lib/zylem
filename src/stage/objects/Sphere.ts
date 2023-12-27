// Sphere is a combination of a 3D mesh and a physics body
import { Group, Mesh, MeshStandardMaterial, SphereGeometry } from 'three';
import { ActiveCollisionTypes, ColliderDesc, RigidBody, RigidBodyDesc, RigidBodyType } from '@dimforge/rapier3d-compat';
import { EntityOptions, GameEntity } from "../../interfaces/Entity";

export class ZylemSphere implements GameEntity<ZylemSphere> {
	_type: string;
	group: Group;
	mesh: Mesh;
	body?: RigidBody;
	bodyDescription: RigidBodyDesc;
	radius?: number;
	_update: (delta: number, options: any) => void;
	_setup: (entity: ZylemSphere) => void;

	constructor(options: EntityOptions) {
		this._type = 'Sphere';
		this.mesh = this.createMesh(options.radius);
		this.group = new Group();
		this.group.add(this.mesh);
		this.bodyDescription = this.createBodyDescription();
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

	createMesh(radius: number | undefined = 1) {
		this.radius = radius;
		const geometry = new SphereGeometry(radius);
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

	createBodyDescription() {
		let rigidBodyDesc = new RigidBodyDesc(RigidBodyType.Dynamic)
			.setGravityScale(1.0)
			.setCanSleep(false)
			.setCcdEnabled(false);

		return rigidBodyDesc;
	}

	createCollider(isSensor: boolean = false) {
		const radius = this.radius || 1;
		const half = radius / 2;
		let colliderDesc = ColliderDesc.ball(half);
		colliderDesc.setSensor(isSensor);
		if (isSensor) {
			// "KINEMATIC_FIXED" will only sense actors moving through the sensor
			colliderDesc.activeCollisionTypes = ActiveCollisionTypes.KINEMATIC_FIXED;
			// colliderDesc.setActiveHooks(RAPIER.ActiveHooks.FILTER_INTERSECTION_PAIRS);
		}
		return colliderDesc;
	}
}