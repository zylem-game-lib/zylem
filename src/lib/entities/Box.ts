import { EntityOptions, GameEntity } from '../interfaces/entity';
import { ActiveCollisionTypes, ColliderDesc, RigidBody, RigidBodyDesc, RigidBodyType } from '@dimforge/rapier3d-compat';
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Vector3, Color } from 'three';

// Box is a combination of a 3D mesh and a physics body
export class ZylemBox implements GameEntity<ZylemBox> {
	_type: string;
	group: Group;
	mesh: Mesh;
	body?: RigidBody;
	size?: Vector3;
	static: boolean = false;
	color: Color = new Color(0xFFFFFF);
	bodyDescription: RigidBodyDesc;
	_update: (delta: number, options: any) => void;
	_setup: (entity: ZylemBox) => void;

	constructor(options: EntityOptions) {
		this._type = 'Box';
		this.color = options.color ?? this.color;
		this.static = options.static ?? this.static;
		this.mesh = this.createMesh(options.size);
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

	update(delta: number, { inputs }: any) { }

	createMesh(vector3: Vector3 | undefined = new Vector3(1, 1, 1)) {
		this.size = vector3;
		const geometry = new BoxGeometry(vector3.x, vector3.y, vector3.z);
		const material = new MeshStandardMaterial({
			color: this.color,
			emissiveIntensity: 1,
			lightMapIntensity: 1,
			fog: true,
		});
		this.mesh = new Mesh(geometry, material);
		this.mesh.position.set(0, 0, 0);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;
		return this.mesh;
	}

	createBodyDescription() {
		const type = this.static ? RigidBodyType.Fixed : RigidBodyType.Dynamic;
		let rigidBodyDesc = new RigidBodyDesc(type)
			.setTranslation(0, 0, 0)
			.setGravityScale(1.0)
			.setCanSleep(false)
			.setCcdEnabled(false);

		return rigidBodyDesc;
	}

	createCollider(isSensor: boolean = false) {
		const size = this.size || new Vector3(1, 1, 1);
		const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
		let colliderDesc = ColliderDesc.cuboid(half.x, half.y, half.z);
		colliderDesc.setSensor(isSensor);
		if (isSensor) {
			// "KINEMATIC_FIXED" will only sense actors moving through the sensor
			colliderDesc.activeCollisionTypes = ActiveCollisionTypes.KINEMATIC_FIXED;
			// colliderDesc.setActiveHooks(RAPIER.ActiveHooks.FILTER_INTERSECTION_PAIRS);
		}
		return colliderDesc;
	}

}