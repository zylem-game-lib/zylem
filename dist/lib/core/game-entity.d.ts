import { Color, Group, Object3D } from 'three';
import { Collider, KinematicCharacterController, RigidBody } from '@dimforge/rapier3d-compat';
import { CollisionOption, GameEntityOptions } from '../interfaces/entity';
import { EntityParameters } from './entity';
import { BaseEntity } from './base-entity';
import { ZylemStage } from './stage';
import { Behavior } from '../behaviors/behavior';
export interface IGameEntity {
    uuid: string;
    eid: number;
    name: string;
    type: string;
    create: Function;
    group: Object3D;
    stageRef: ZylemStage | null;
    _custom: any;
    _behaviors: Behavior[];
    setup: Function;
    update: Function;
    destroy: Function;
}
export declare class GameEntity<T> extends BaseEntity<T> {
	stageRef: ZylemStage | null;
	group: Group;
	body: RigidBody | null;
	controlledRotation: boolean;
	characterController: null | KinematicCharacterController;
	collider: null | Collider;
	name: string;
	type: string;
	_collision: CollisionOption<T> | null;
	static counter: number;
	_behaviors: Behavior[];
	constructor(options: GameEntityOptions<{
        collision?: CollisionOption<T>;
    }, T>);
	private setName;
	create(): Promise<T>;
	setup(params: EntityParameters<T>): void;
	update(params: EntityParameters<T>): void;
	destroy(params: EntityParameters<T>): void;
	collision(entity: GameEntity<T>, other: GameEntity<T>): void;
	setColor(color: Color): void;
	private movement;
}
