import { ActiveCollisionTypes, ColliderDesc } from '@dimforge/rapier3d-compat';
import { Vector3 } from 'three';
import { BaseNode } from '../core/base-node';
import { EntityBuilder, EntityCollisionBuilder, GameEntityOptions, GameEntity } from './entity';
import { createEntity } from './create';
import { CollisionHandlerDelegate } from '../collision/collision-delegate';
import { state } from '../game/game-state';
import { Stage } from '../stage/stage';

export type OnHeldParams = {
	delta: number;
	self: ZylemZone;
	visitor: GameEntity<any>;
	heldTime: number;
	globals: any;
	stage: Stage;
}

export type OnEnterParams = Pick<OnHeldParams, 'self' | 'visitor' | 'globals' | 'stage'>;
export type OnExitParams = Pick<OnHeldParams, 'self' | 'visitor' | 'globals' | 'stage'>;

type ZylemZoneOptions = GameEntityOptions & {
	size?: Vector3;
	static?: boolean;
	onEnter?: (params: OnEnterParams) => void;
	onHeld?: (params: OnHeldParams) => void;
	onExit?: (params: OnExitParams) => void;
	stageRef?: Stage;
};

const zoneDefaults: ZylemZoneOptions = {
	size: new Vector3(1, 1, 1),
	position: new Vector3(0, 0, 0),
	collision: {
		static: true,
	},
	material: {
		shader: 'standard'
	},
};

export class ZoneCollisionBuilder extends EntityCollisionBuilder {
	collider(options: ZylemZoneOptions): ColliderDesc {
		const size = options.size || new Vector3(1, 1, 1);
		const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
		let colliderDesc = ColliderDesc.cuboid(half.x, half.y, half.z);
		colliderDesc.setSensor(true);
		colliderDesc.activeCollisionTypes = ActiveCollisionTypes.KINEMATIC_FIXED;
		return colliderDesc;
	}
}

export class ZoneBuilder extends EntityBuilder<ZylemZone, ZylemZoneOptions> {
	protected createEntity(options: Partial<ZylemZoneOptions>): ZylemZone {
		return new ZylemZone(options);
	}
}

export const ZONE_TYPE = Symbol('Zone');

export class ZylemZone extends GameEntity<ZylemZoneOptions> implements CollisionHandlerDelegate {
	static type = ZONE_TYPE;

	private _enteredZone: Map<string, number> = new Map();
	private _exitedZone: Map<string, number> = new Map();
	private _zoneEntities: Map<string, any> = new Map();
	stageRef: Stage;

	constructor(options?: ZylemZoneOptions) {
		super();
		this.options = { ...zoneDefaults, ...options };
		this.stageRef = this.options.stageRef!;
	}

	public handlePostCollision({ delta }: { delta: number }): boolean {
		this._enteredZone.forEach((val, key) => {
			this.exited(delta, key);
		});
		return this._enteredZone.size > 0;
	}

	public handleIntersectionEvent({ other, delta }: { other: any, delta: number }) {
		const hasEntered = this._enteredZone.get(other.uuid);
		if (!hasEntered) {
			this.entered(other);
			this._zoneEntities.set(other.uuid, other);
		} else {
			this.held(delta, other);
		}
	}

	onEnter(callback: (params: OnEnterParams) => void) {
		this.options.onEnter = callback;
		return this;
	}

	onHeld(callback: (params: OnHeldParams) => void) {
		this.options.onHeld = callback;
		return this;
	}

	onExit(callback: (params: OnExitParams) => void) {
		this.options.onExit = callback;
		return this;
	}

	entered(other: any) {
		this._enteredZone.set(other.uuid, 1);
		if (this.options.onEnter) {
			this.options.onEnter({
				self: this,
				visitor: other,
				globals: state.globals,
				stage: this.stageRef!,
			});
		}
	}

	exited(delta: number, key: string) {
		const hasExited = this._exitedZone.get(key);
		if (hasExited && hasExited > 1 + delta) {
			this._exitedZone.delete(key);
			this._enteredZone.delete(key);
			const other = this._zoneEntities.get(key);
			if (this.options.onExit) {
				this.options.onExit({
					self: this,
					visitor: other,
					globals: state.globals,
					stage: this.stageRef!,
				});
			}
			return;
		}
		this._exitedZone.set(key, 1 + delta);
	}

	held(delta: number, other: any) {
		const heldTime = this._enteredZone.get(other.uuid) ?? 0;
		this._enteredZone.set(other.uuid, heldTime + delta);
		this._exitedZone.set(other.uuid, 1);
		if (this.options.onHeld) {
			this.options.onHeld({
				delta,
				self: this,
				visitor: other,
				globals: state.globals,
				heldTime,
				stage: this.stageRef!,
			});
		}
	}
}

type ZoneOptions = BaseNode | Partial<ZylemZoneOptions>;

export async function zone(...args: Array<ZoneOptions>): Promise<ZylemZone> {
	return createEntity<ZylemZone, ZylemZoneOptions>({
		args,
		defaultConfig: zoneDefaults,
		EntityClass: ZylemZone,
		BuilderClass: ZoneBuilder,
		CollisionBuilderClass: ZoneCollisionBuilder,
		entityType: ZylemZone.type
	});
}