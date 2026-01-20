import { Group } from 'three';
import { RigidBody, Collider } from '@dimforge/rapier3d-compat';

/**
 * Base entity interface - shared across modules to prevent circular dependencies
 */
interface BaseEntityInterface {
    uuid: string;
    name: string;
    eid: number;
    group: Group | null | undefined;
    body: RigidBody | null | undefined;
    collider: Collider | null | undefined;
}
/**
 * Game entity interface - minimal interface to break circular dependencies
 */
interface GameEntityInterface extends BaseEntityInterface {
    type: string;
    isStatic: boolean;
    setPosition(x: number, y: number, z: number): void;
    setRotation(x: number, y: number, z: number): void;
    setScale(x: number, y: number, z: number): void;
}

export type { BaseEntityInterface as B, GameEntityInterface as G };
