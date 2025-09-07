import { ColliderDesc, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { Vec3 } from "../core/vector";
import { CollisionOptions } from "./collision";
export declare function getOrCreateCollisionGroupId(type: string): number;
export declare function createCollisionFilter(allowedTypes: string[]): number;
export declare function setCollisionGroups(collider: ColliderDesc, entityType: string, allowedTypes: string[]): void;
export type ColliderFunction = () => ColliderDesc;
export type RigidBodyFunction = ({ isDynamicBody }: {
    isDynamicBody: boolean;
}) => RigidBodyDesc;
export declare class CollisionBuilder {
    static: boolean;
    sensor: boolean;
    gravity: Vec3;
    build(options: Partial<CollisionOptions>): [RigidBodyDesc, ColliderDesc];
    withCollision(collisionOptions: Partial<CollisionOptions>): this;
    collider(options: CollisionOptions): ColliderDesc;
    bodyDesc({ isDynamicBody }: {
        isDynamicBody?: boolean | undefined;
    }): RigidBodyDesc;
}
