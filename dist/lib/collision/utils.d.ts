import type { GameEntity } from "../entities/entity";
import type { CollisionMask } from "./collision-mask";
export type NameSelector = string | string[] | RegExp;
export type CollisionSelector = {
    name: NameSelector;
} | {
    mask: CollisionMask | RegExp;
} | {
    test: (other: GameEntity<any>) => boolean;
};
/**
 * Returns true if the `other` entity matches the provided selector.
 */
export declare function matchesCollisionSelector(other: GameEntity<any>, selector?: CollisionSelector): boolean;
