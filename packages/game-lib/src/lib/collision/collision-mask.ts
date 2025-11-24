import { createCollisionFilter, getOrCreateCollisionGroupId } from "./collision-builder";
import type { GameEntity } from "../entities/entity";

/**
 * A branded bitmask representing a set of collision types.
 * Construct with {@link buildCollisionMask}.
 */
export type CollisionMask = number & { readonly __brand: "CollisionMask" };

/**
 * Builds a bitmask from one or more collision type names.
 * The type names should match the values set on `GameEntity.collisionType`.
 */
export function buildCollisionMask(...types: string[]): CollisionMask {
	return createCollisionFilter(types) as CollisionMask;
}

/**
 * Tests whether the given entity's collision type is included in the mask.
 */
export function entityMatchesMask(entity: GameEntity<any>, mask: CollisionMask): boolean {
	const type = entity.collisionType ?? "";
	const groupId = getOrCreateCollisionGroupId(type);
	return (mask & (1 << groupId)) !== 0;
}


