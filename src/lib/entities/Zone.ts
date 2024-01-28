import { ActiveCollisionTypes, ColliderDesc, RigidBody, RigidBodyDesc, RigidBodyType } from "@dimforge/rapier3d-compat";
import { BoxGeometry, Color, Group, Mesh, MeshPhongMaterial, Vector3 } from "three";
import { Entity, EntityOptions, GameEntity } from "~/lib/interfaces/entity";
import { UpdateOptions } from "~/lib/interfaces/update";

export type InternalCollisionParams = {
	delta: number;
	entity: ZylemZone;
	other: any;
}

export type OnHeldParams = {
	delta: number;
	entity: ZylemZone;
	other: any;
	heldTime: number;
	// TODO: pass in actual game globals
	gameGlobals: any;
}

export type OnEnterParams = Pick<OnHeldParams, 'entity' | 'other' | 'gameGlobals'>;
export type OnExitParams = Pick<OnHeldParams, 'entity' | 'other' | 'gameGlobals'>;

export type ZoneOptions = EntityOptions & {
	onEnter: (params: OnEnterParams) => void;
	onHeld: (params: OnHeldParams) => void;
	onExit: (params: OnExitParams) => void;
}

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

	_enteredZone: Map<string, number> = new Map();
	_exitedZone: Map<string, number> = new Map();
	_zoneEntities: Map<string, GameEntity<any>> = new Map();

	// User defined customized events
	_update: (delta: number, options: any) => void;
	_setup: (entity: ZylemZone) => void;
	_onEnter: (params: OnEnterParams) => void;
	_onHeld: (params: OnHeldParams) => void;
	_onExit: (params: OnExitParams) => void;

	constructor(options: ZoneOptions) {
		this._type = 'Zone';
		this._update = options.update;
		this._setup = options.setup;
		this._onHeld = options.onHeld;
		this._onEnter = options.onEnter;
		this._onExit = options.onExit;
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

	_internalPostCollisionBehavior({ entity, delta }: InternalCollisionParams) {
		entity._enteredZone.forEach((val, key) => {
			entity.exited(delta, key as any);
		})
		return entity._enteredZone.size > 0;
	}

	_internalCollisionBehavior({ entity, other, delta }: InternalCollisionParams) {
		const hasEntered = entity._enteredZone.get(other.name);
		if (!hasEntered) {
			entity.entered(other);
			entity._zoneEntities.set(other.name!, other);
		} else {
			entity.held(delta, other);
		}
	}

	entered(other: GameEntity<any>) {
		// TODO: needs hard id
		this._enteredZone.set(other.name!, 1);
		this._onEnter({ entity: this, other, gameGlobals: {} });
	}

	exited(delta: number, key: string) {
		// TODO: needs hard id
		const hasExited = this._exitedZone.get(key);
		if (hasExited && hasExited > 1 + delta) {
			this._exitedZone.delete(key);
			this._enteredZone.delete(key);
			const other = this._zoneEntities.get(key);
			this._onExit({ entity: this, other, gameGlobals: {} });
			return;
		}
		this._exitedZone.set(key, 1 + delta);
	}

	held(delta: number, other: GameEntity<any>) {
		const heldTime = this._enteredZone.get(other.name!) ?? 0;
		this._enteredZone.set(other.name!, heldTime + delta);
		this._exitedZone.set(other.name!, 1);
		this._onHeld({ delta, entity: this, other, gameGlobals: {}, heldTime });
	}

	setup(entity: ZylemZone) {
		this._setup(this);
	};

	destroy() { };

	update(delta: number, options: UpdateOptions<Entity<ZylemZone>>) { };

}