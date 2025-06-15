import { ColliderDesc, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { PhysicsOptions } from "./physics";
import { Vec3 } from "../core/vector";
import { CollisionOptions } from "./collision";
import { EntityOptions } from "../core";
export type ColliderFunction = () => ColliderDesc;
export type RigidBodyFunction = ({ isDynamicBody }: {
    isDynamicBody: boolean;
}) => RigidBodyDesc;
export declare class CollisionBuilder {
    static: boolean;
    sensor: boolean;
    gravity: Vec3;
    build(options: EntityOptions): [RigidBodyDesc, ColliderDesc];
    withCollision(collisionOptions: Partial<CollisionOptions>): this;
    withPhysics(physicsOptions: Partial<PhysicsOptions>): this;
    collider(options: EntityOptions): ColliderDesc;
    rigidBody({ isDynamicBody }: {
        isDynamicBody?: boolean | undefined;
    }): RigidBodyDesc;
}
