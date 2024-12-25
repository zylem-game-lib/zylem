import { RigidBodyDesc } from '@dimforge/rapier3d-compat';
export declare class BaseCollision {
	static: boolean;
	isSensor: boolean;
	bodyDescription: RigidBodyDesc;
	constructor({ isDynamicBody }: {
        isDynamicBody?: boolean | undefined;
    });
}
export declare const CollisionComponent: import('bitecs').ComponentType<{
    static: 'i8';
    isSensor: 'i8';
    bodyDescription: 'i8';
}>;
export declare const CollisionDebugComponent: import('bitecs').ComponentType<{
    active: 'i8';
    color: 'f32';
}>;
