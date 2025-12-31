import { RigidBody, Collider, KinematicCharacterController } from '@dimforge/rapier3d-compat';
import { Group, Mesh } from 'three';

type LifecycleFunction<T> = (params?: any) => void;
interface Entity<T = any> {
    setup: (entity: T) => void;
    destroy: () => void;
    update: LifecycleFunction<T>;
    type: string;
    _collision?: (entity: any, other: any, globals?: any) => void;
    _destroy?: (globals?: any) => void;
    name?: string;
    tag?: Set<string>;
}
interface StageEntity extends Entity {
    uuid: string;
    body: RigidBody;
    group: Group;
    mesh: Mesh;
    instanceId: number;
    collider: Collider;
    controlledRotation: boolean;
    characterController: KinematicCharacterController;
    name: string;
    markedForRemoval: boolean;
}

export type { Entity as E, LifecycleFunction as L, StageEntity as S };
