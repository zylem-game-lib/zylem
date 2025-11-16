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
export interface CollisionOptions {
    static?: boolean;
    sensor?: boolean;
    size?: Vector3;
    position?: Vector3;
    collisionType?: string;
    collisionFilter?: string[];
}
//# sourceMappingURL=collision.d.ts.map