import { ColliderDesc } from '@dimforge/rapier3d-compat';
import { Vector3 } from 'three';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { EntityBuilder } from './builder';
import { EntityCollisionBuilder } from './builder';
import { CollisionHandlerDelegate } from '../collision/collision-delegate';
export type OnHeldParams = {
    delta: number;
    self: ZylemZone;
    visitor: GameEntity<any>;
    heldTime: number;
    globals: any;
};
export type OnEnterParams = Pick<OnHeldParams, 'self' | 'visitor' | 'globals'>;
export type OnExitParams = Pick<OnHeldParams, 'self' | 'visitor' | 'globals'>;
type ZylemZoneOptions = GameEntityOptions & {
    size?: Vector3;
    static?: boolean;
    onEnter?: (params: OnEnterParams) => void;
    onHeld?: (params: OnHeldParams) => void;
    onExit?: (params: OnExitParams) => void;
};
export declare class ZoneCollisionBuilder extends EntityCollisionBuilder {
    collider(options: ZylemZoneOptions): ColliderDesc;
}
export declare class ZoneBuilder extends EntityBuilder<ZylemZone, ZylemZoneOptions> {
    protected createEntity(options: Partial<ZylemZoneOptions>): ZylemZone;
}
export declare const ZONE_TYPE: unique symbol;
export declare class ZylemZone extends GameEntity<ZylemZoneOptions> implements CollisionHandlerDelegate {
    static type: symbol;
    private _enteredZone;
    private _exitedZone;
    private _zoneEntities;
    constructor(options?: ZylemZoneOptions);
    handlePostCollision({ delta }: {
        delta: number;
    }): boolean;
    handleIntersectionEvent({ other, delta }: {
        other: any;
        delta: number;
    }): void;
    onEnter(callback: (params: OnEnterParams) => void): this;
    onHeld(callback: (params: OnHeldParams) => void): this;
    onExit(callback: (params: OnExitParams) => void): this;
    entered(other: any): void;
    exited(delta: number, key: string): void;
    held(delta: number, other: any): void;
}
type ZoneOptions = BaseNode | Partial<ZylemZoneOptions>;
export declare function zone(...args: Array<ZoneOptions>): Promise<ZylemZone>;
export {};
