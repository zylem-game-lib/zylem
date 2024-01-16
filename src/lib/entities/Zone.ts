import { ActiveCollisionTypes, ColliderDesc, RigidBody, RigidBodyDesc, RigidBodyType } from "@dimforge/rapier3d-compat";
import { BoxGeometry, Color, Group, Mesh, MeshPhongMaterial, Vector3 } from "three";
import { Entity, EntityOptions, GameEntity } from "~/lib/interfaces/entity";
import { UpdateOptions } from "~/lib/interfaces/Update";

export class ZylemZone implements GameEntity<ZylemZone> {
	_type: string;
	debug?: boolean | undefined;
	debugColor?: Color = new Color(Color.NAMES.limegreen);
	_debugMesh?: Mesh | undefined;

	_collision?: ((entity: any, other: any, globals?: any) => void) | undefined;
	_destroy?: ((globals?: any) => void) | undefined;
	name?: string | undefined;
	tag?: Set<string> | undefined;

	area?: RigidBody | undefined;
	size?: Vector3;
	radius?: number;

	group: Group;
	body?: RigidBody | undefined;
	bodyDescription: RigidBodyDesc;
	constraintBodies?: RigidBody[] | undefined;
	sensor?: boolean | undefined;

	_enteredZone: Record<string, number> = {};
	_exitedZone: Record<string, number> = {};

	// User defined customized events
	_update: (delta: number, options: any) => void;
	_setup: (entity: ZylemZone) => void;

	constructor(options: EntityOptions) {
		this._type = 'Zone';
		this._update = options.update;
		this._setup = options.setup;
		this.size = options.size;
		this.group = new Group();
		if (options.debug) {
			this._debugMesh = this.createDebugMesh(options);
			this.group.add(this._debugMesh);
		}
		this.bodyDescription = this.createBodyDescription();
	}

	createBodyDescription() {
		let rigidBodyDesc = new RigidBodyDesc(RigidBodyType.Fixed)
			.setTranslation(0, 0, 0)
			.setCanSleep(false)
			.setCcdEnabled(false);

		return rigidBodyDesc;
	}

	createCollider(isSensor: boolean = true) {
		const size = this.size || new Vector3(1, 1, 1);
		const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
		let colliderDesc = ColliderDesc.cuboid(half.x, half.y, half.z);
		colliderDesc.setSensor(true);
		colliderDesc.activeCollisionTypes = ActiveCollisionTypes.KINEMATIC_FIXED;
		return colliderDesc;
	}

	createDebugMesh(options: Pick<EntityOptions, 'debugColor' | 'size'>) {
		this.debugColor = options.debugColor ?? this.debugColor;
		const debugMaterial = new MeshPhongMaterial({ color: this.debugColor });
		debugMaterial.wireframe = true;
		debugMaterial.needsUpdate = true;
		const { x, y, z } = options.size ?? new Vector3(1, 1, 1);
		return new Mesh(new BoxGeometry(x, y, z), debugMaterial);
	}

	entered(other: GameEntity<any>) {

	}

	exited(other: GameEntity<any>) {

	}

	held(other: GameEntity<any>, delta: number) {

	}

	setup(entity: ZylemZone) {
		this._setup(this);
	};

	destroy() { };

	update(delta: number, options: UpdateOptions<Entity<ZylemZone>>) { };

}