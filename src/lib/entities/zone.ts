import { Vector3 } from "three";
import { GameEntityOptions } from "~/lib/interfaces/entity";
import { BoxCollision } from "../collision/collision";
import { applyMixins } from "../core/composable";
import { GameEntity } from "../core/game-entity";
import { LifecycleParameters, UpdateParameters } from "../core/entity";
import { Moveable } from "../behaviors/moveable";
import { SizeVector } from "../interfaces/utility";

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

export type ZylemZoneOptions = GameEntityOptions<ZylemZone> & {
	size?: Vector3;
	static?: boolean;
	onEnter: (params: OnEnterParams) => void;
	onHeld: (params: OnHeldParams) => void;
	onExit: (params: OnExitParams) => void;
}

export class ZylemZone extends GameEntity<ZylemZone> {
	protected type = 'Zone';
	_size: SizeVector = null;
	_static: boolean = false;
	// _collision?: ((entity: any, other: any, globals?: any) => void) | undefined;

	_enteredZone: Map<string, number> = new Map();
	_exitedZone: Map<string, number> = new Map();
	_zoneEntities: Map<string, GameEntity<any>> = new Map();

	_onEnter: (params: OnEnterParams) => void;
	_onHeld: (params: OnHeldParams) => void;
	_onExit: (params: OnExitParams) => void;

	constructor(options: ZylemZoneOptions) {
		const bluePrint = options;
		super(bluePrint);
		this._onHeld = bluePrint.onHeld;
		this._onEnter = bluePrint.onEnter;
		this._onExit = bluePrint.onExit;
		this._static = bluePrint.static ?? true;
		this._size = bluePrint.size ?? new Vector3(1, 1, 1);
		// TODO: isSensor needs to be a property of game entity
		// this.isSensor = true;
	}

	public createFromBlueprint(): this {
		this.createCollision({ isDynamicBody: !this._static });
		return this;
	}

	_internalPostCollisionBehavior({ entity, delta }: InternalCollisionParams) {
		entity._enteredZone.forEach((val, key) => {
			entity.exited(delta, key as any);
		})
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

	entered(other: GameEntity<any>) {
		// TODO: needs hard id
		this._enteredZone.set(other.uuid, 1);
		if (this._onEnter) {
			this._onEnter({ entity: this, other, gameGlobals: {} });
		}
	}

	exited(delta: number, key: string) {
		// TODO: needs hard id
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

	held(delta: number, other: GameEntity<any>) {
		const heldTime = this._enteredZone.get(other.uuid) ?? 0;
		this._enteredZone.set(other.uuid, heldTime + delta);
		this._exitedZone.set(other.uuid, 1);
		this._onHeld({ delta, entity: this, other, gameGlobals: {}, heldTime });
	}

	public setup(params: LifecycleParameters<ZylemZone>) {
		super.setup({ ...params, entity: this });
		this._setup({ ...params, entity: this });
	}

	public update(params: UpdateParameters<ZylemZone>): void {
		super.update({ ...params, entity: this });
		this._update({ ...params, entity: this });
	}

	public destroy(params: LifecycleParameters<ZylemZone>): void {
		super.destroy({ ...params, entity: this });
		this._destroy({ ...params, entity: this });
	}

}

class _Zone {};

export interface ZylemZone extends BoxCollision, Moveable, _Zone { };

export function Zone(options: ZylemZoneOptions): ZylemZone {
	applyMixins(ZylemZone, [BoxCollision, Moveable, _Zone]);

	return new ZylemZone(options) as ZylemZone;
}