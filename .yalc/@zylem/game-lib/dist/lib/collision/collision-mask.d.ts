import type { GameEntity } from "../entities/entity";
/**
 * A branded bitmask representing a set of collision types.
 * Construct with {@link buildCollisionMask}.
 */
export type CollisionMask = number & {
    readonly __brand: "CollisionMask";
};
/**
 * Builds a bitmask from one or more collision type names.
 * The type names should match the values set on `GameEntity.collisionType`.
 */
export declare function buildCollisionMask(...types: string[]): CollisionMask;
/**
 * Tests whether the given entity's collision type is included in the mask.
 */
export declare function entityMatchesMask(entity: GameEntity<any>, mask: CollisionMask): boolean;
