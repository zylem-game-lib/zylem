import { Collider, KinematicCharacterController, RigidBody } from "@dimforge/rapier3d-compat";
import { Group, Mesh } from "three";
export type LifecycleFunction<T> = (params?: any) => void;
export type CollisionOption = (entity: any, other: any, globals?: Global) => void;
export interface Entity<T = any> {
    setup: (entity: T) => void;
    destroy: () => void;
    update: LifecycleFunction<T>;
    type: string;
    _collision?: (entity: any, other: any, globals?: any) => void;
    _destroy?: (globals?: any) => void;
    name?: string;
    tag?: Set<string>;
}
export interface StageEntity extends Entity {
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
export type OptionalVector = {
    x?: number;
    y?: number;
    z?: number;
};
//# sourceMappingURL=entity.d.ts.map