import { Vector3 } from 'three';
import { GameEntityOptions } from '../../interfaces/entity';
import { GameEntity, EntityParameters, IGameEntity } from '../../core';
import { Moveable } from '../../behaviors/moveable';
import { ZoneCollision } from './index';
export type InternalCollisionParams = {
    delta: number;
    entity: ZylemZone;
    other: any;
};
export type OnHeldParams = {
    delta: number;
    entity: ZylemZone;
    other: any;
    heldTime: number;
    gameGlobals: any;
};
export type OnEnterParams = Pick<OnHeldParams, 'entity' | 'other' | 'gameGlobals'>;
export type OnExitParams = Pick<OnHeldParams, 'entity' | 'other' | 'gameGlobals'>;
export type ZylemZoneOptions = {
    size?: Vector3;
    static?: boolean;
    onEnter: (params: OnEnterParams) => void;
    onHeld: (params: OnHeldParams) => void;
    onExit: (params: OnExitParams) => void;
};
type ZoneOptions = GameEntityOptions<ZylemZoneOptions, ZylemZone>;
declare const ZylemZone_base: import('ts-mixer/dist/types/types').Class<any[], GameEntity<unknown> & ZoneCollision & Moveable, (new (options: GameEntityOptions<{
    collision?: import('../../interfaces/entity').CollisionOption<unknown> | undefined;
}, unknown>) => GameEntity<unknown>) & typeof ZoneCollision & typeof Moveable>;
export declare class ZylemZone extends ZylemZone_base {
	type: string;
	_enteredZone: Map<string, number>;
	_exitedZone: Map<string, number>;
	_zoneEntities: Map<string, IGameEntity>;
	_onEnter: (params: OnEnterParams) => void;
	_onHeld: (params: OnHeldParams) => void;
	_onExit: (params: OnExitParams) => void;
	constructor(options: ZoneOptions);
	create(): Promise<this>;
	_internalPostCollisionBehavior({ entity, delta }: InternalCollisionParams): boolean;
	_internalCollisionBehavior({ entity, other, delta }: InternalCollisionParams): void;
	entered(other: IGameEntity): void;
	exited(delta: number, key: string): void;
	held(delta: number, other: IGameEntity): void;
	setup(params: EntityParameters<ZylemZone>): void;
	update(params: EntityParameters<ZylemZone>): void;
	destroy(params: EntityParameters<ZylemZone>): void;
}
export declare function zone(options: ZoneOptions): ZylemZone;
export {};
