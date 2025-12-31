import type { GameEntity } from "../entities/entity";
import { getOrCreateCollisionGroupId } from "./collision-builder";

/**
 * A branded bitmask representing a set of collision types.
 */
export type CollisionMask = number & { readonly __brand: "CollisionMask" };

export type NameSelector = string | string[] | RegExp;

export type CollisionSelector =
	| { name: NameSelector }
	| { mask: CollisionMask | RegExp }
	| { test: (other: GameEntity<any>) => boolean };

/**
 * Returns true if the `other` entity matches the provided selector.
 */
export function matchesCollisionSelector(other: GameEntity<any>, selector?: CollisionSelector): boolean {
	if (!selector) return true;
	const otherName = other.name ?? '';
	if ('name' in selector) {
		const sel = selector.name as NameSelector;
		if (sel instanceof RegExp) {
			return sel.test(otherName);
		} else if (Array.isArray(sel)) {
			return sel.some(s => s === otherName);
		} else {
			return otherName === sel;
		}
	} else if ('mask' in selector) {
		const m = selector.mask as CollisionMask | RegExp;
		if (m instanceof RegExp) {
			const type = other.collisionType ?? '';
			return m.test(type);
		} else {
			const type = other.collisionType ?? '';
			const gid = getOrCreateCollisionGroupId(type);
			return ((m as number) & (1 << gid)) !== 0;
		}
	} else if ('test' in selector) {
		return !!selector.test(other);
	}
	return true;
}
