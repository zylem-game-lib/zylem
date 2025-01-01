import { ActiveCollisionTypes, ColliderDesc } from '@dimforge/rapier3d-compat';
import { Vector3 } from 'three';
// import { BaseCollision } from '~/lib/collision/_oldCollision';
import { SizeVector } from '~/lib/interfaces/utility';
import { Mixin } from 'ts-mixer';

import { StageEntityOptions } from '../interfaces/entity';
import { StageEntity, EntityParameters, IGameEntity } from '../core';
import { Moveable } from '../behaviors/moveable';

export class ZoneCollision { //extends BaseCollision {
	_size: SizeVector = new Vector3(1, 1, 1);

	createCollider(_isSensor: boolean = true) {
		const size = this._size || new Vector3(1, 1, 1);
		const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
		let colliderDesc = ColliderDesc.cuboid(half.x, half.y, half.z);
		colliderDesc.setSensor(true);
		colliderDesc.activeCollisionTypes = ActiveCollisionTypes.KINEMATIC_FIXED;
		return colliderDesc;
	}
}

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

export type ZylemZoneOptions = {
	size?: Vector3;
	static?: boolean;
	onEnter: (params: OnEnterParams) => void;
	onHeld: (params: OnHeldParams) => void;
	onExit: (params: OnExitParams) => void;
}

type ZoneOptions = StageEntityOptions<ZylemZoneOptions, ZylemZone>;

export class ZylemZone extends Mixin(StageEntity, ZoneCollision, Moveable) {
	public type = 'Zone';

	_enteredZone: Map<string, number> = new Map();
	_exitedZone: Map<string, number> = new Map();
	_zoneEntities: Map<string, IGameEntity> = new Map();

	_onEnter: (params: OnEnterParams) => void;
	_onHeld: (params: OnHeldParams) => void;
	_onExit: (params: OnExitParams) => void;

	constructor(options: ZoneOptions) {
		super(options as StageEntityOptions<{}>);
		this._onHeld = options.onHeld || (() => { });
		this._onEnter = options.onEnter || (() => { });
		this._onExit = options.onExit || (() => { });
		this._static = options.static ?? true;
		this._size = options.size ?? new Vector3(1, 1, 1);
	}

	async create(): Promise<this> {
		this.createCollision({ isDynamicBody: !this._static });
		return Promise.resolve(this);
	}

	_internalPostCollisionBehavior({ entity, delta }: InternalCollisionParams) {
		entity._enteredZone.forEach((val, key) => {
			entity.exited(delta, key as any);
		});
		return entity._enteredZone.size > 0;
	}

	_internalCollisionBehavior({ entity, other, delta }: InternalCollisionParams) {
		const hasEntered = entity._enteredZone.get(other.uuid);
		if (!hasEntered) {
			entity.entered(other);
			entity._zoneEntities.set(other.uuid, other);
		} else {
			entity.held(delta, other);
		}
	}

	entered(other: IGameEntity) {
		this._enteredZone.set(other.uuid, 1);
		if (this._onEnter) {
			this._onEnter({ entity: this, other, gameGlobals: {} });
		}
	}

	exited(delta: number, key: string) {
		const hasExited = this._exitedZone.get(key);
		if (hasExited && hasExited > 1 + delta) {
			this._exitedZone.delete(key);
			this._enteredZone.delete(key);
			const other = this._zoneEntities.get(key);
			if (this._onExit) {
				this._onExit({ entity: this, other, gameGlobals: {} });
			}
			return;
		}
		this._exitedZone.set(key, 1 + delta);
	}

	held(delta: number, other: IGameEntity) {
		const heldTime = this._enteredZone.get(other.uuid) ?? 0;
		this._enteredZone.set(other.uuid, heldTime + delta);
		this._exitedZone.set(other.uuid, 1);
		this._onHeld({ delta, entity: this, other, gameGlobals: {}, heldTime });
	}

	public setup(params: EntityParameters<ZylemZone>): void {
		super.setup(params);
		this._setup({ ...params, entity: this });
	}

	public update(params: EntityParameters<ZylemZone>): void {
		super.update(params);
		this._update({ ...params, entity: this });
	}

	public destroy(params: EntityParameters<ZylemZone>): void {
		super.destroy(params);
		this._destroy({ ...params, entity: this });
	}

}

export function zone(options: ZoneOptions): ZylemZone {
	return new ZylemZone(options) as ZylemZone;
}