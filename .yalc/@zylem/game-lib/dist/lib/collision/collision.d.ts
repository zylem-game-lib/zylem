import { RigidBodyDesc } from '@dimforge/rapier3d-compat';
import { Vector3 } from 'three';
export declare class BaseCollision {
    static: boolean;
    isSensor: boolean;
    bodyDescription: RigidBodyDesc;
    constructor({ isDynamicBody }: {
        isDynamicBody?: boolean | undefined;
    });
}
export declare const CollisionComponent: import("bitecs").ComponentType<{
    static: "i8";
    isSensor: "i8";
    bodyDescription: "i8";
}>;
export declare const CollisionDebugComponent: import("bitecs").ComponentType<{
    active: "i8";
    color: "f32";
}>;
export interface CollisionOptions {
    static?: boolean;
    sensor?: boolean;
    size?: Vector3;
    position?: Vector3;
    collisionType?: string;
    collisionFilter?: string[];
}
