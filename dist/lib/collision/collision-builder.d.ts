import { ColliderDesc, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { PhysicsOptions } from "./physics";
import { Vec3 } from "../core/vector";
import { CollisionOptions } from "./collision";
import { GameEntityOptions } from "../entities/entity";
/**
 * Get or create a collision group ID for a given collision type
 */
export declare function getOrCreateCollisionGroupId(type: string): number;
/**
 * Create a collision filter mask for the specified collision types
 */
export declare function createCollisionFilter(allowedTypes: string[]): number;
/**
 * Set collision groups on a collider using Rapier's built-in system
 */
export declare function setCollisionGroups(collider: ColliderDesc, entityType: string, allowedTypes: string[]): void;
export type ColliderFunction = () => ColliderDesc;
export type RigidBodyFunction = ({ isDynamicBody }: {
    isDynamicBody: boolean;
}) => RigidBodyDesc;
export declare class CollisionBuilder {
    static: boolean;
    sensor: boolean;
    gravity: Vec3;
    build(options: GameEntityOptions): [RigidBodyDesc, ColliderDesc];
    withCollision(collisionOptions: Partial<CollisionOptions>): this;
    withPhysics(physicsOptions: Partial<PhysicsOptions>): this;
    collider(options: GameEntityOptions): ColliderDesc;
    bodyDesc({ isDynamicBody }: {
        isDynamicBody?: boolean | undefined;
    }): RigidBodyDesc;
}
