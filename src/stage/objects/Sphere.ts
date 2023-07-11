// Sphere is a combination of a 3D mesh and a physics body
import { Body, Sphere, HingeConstraint, Vec3, Constraint } from 'cannon-es';
import { Mesh, MeshStandardMaterial, SphereGeometry } from 'three';
import { EntityClass, EntityOptions, GameEntity, AnyConstraint } from "@/interfaces/Entity";

export class ZylemSphere extends EntityClass implements GameEntity<ZylemSphere> {
	_type: string;
	mesh: Mesh;
	body: Body;
	constraintBodies: Body[];
	constraints: AnyConstraint[];
	_update: (delta: number, options: any) => void;
	_setup: (entity: ZylemSphere) => void;

	constructor(options: EntityOptions) {
		super();
		this._type = 'Sphere';
		this.constraints = [];
		this.constraintBodies = [];
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
		const sphere = new Sphere(1);
		this.body = new Body({
			mass: 1,
			shape: sphere,
			fixedRotation: true,
			angularDamping: 1,
			angularFactor: new Vec3(1, 1, 0),
		});
		this.body.position.set(0, 0, 0);

		return this.body;
	}
}