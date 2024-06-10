import { Color, Group } from 'three';
import { CollisionOption, GameEntityOptions } from '../interfaces/entity';
import { EntityParameters } from './entity';
import { Collider, KinematicCharacterController, RigidBody } from '@dimforge/rapier3d-compat';
import { EntityBehavior } from '../behaviors/behavior';
import { BaseEntity } from './base-entity';
import { ZylemStage } from './stage';
export declare class GameEntity<T> extends BaseEntity<T> {
    stageRef: ZylemStage | null;
    group: Group;
    body: RigidBody | null;
    controlledRotation: boolean;
    characterController: null | KinematicCharacterController;
    collider: null | Collider;
    name: string;
    protected type: string;
    _collision: CollisionOption<T> | null;
    static counter: number;
    constructor(options: GameEntityOptions<{
        collision?: CollisionOption<T>;
    }, T>);
    protected createUuid(type: string): void;
    createFromBlueprint(): Promise<any>;
    setup(_params: Partial<EntityParameters<any>>): void;
    update(_params: EntityParameters<any>): void;
    destroy(_params: EntityParameters<any>): void;
    collision(entity: GameEntity<T>, other: GameEntity<T>): void;
    setColor(color: Color): void;
    private movement;
    use(behavior: EntityBehavior): void;
}
