import { RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { Color, Vector3 } from "three";
export interface BoxCollisionInterface {
    createCollision: (params: CreateCollisionParameters) => void;
}
export type CreateCollisionParameters = {
    isDynamicBody?: boolean;
    size?: Vector3 | undefined;
};
export declare class BaseCollision {
    _static: boolean;
    _isSensor: boolean;
    bodyDescription: RigidBodyDesc | null;
    debugCollision: boolean;
    debugColor: Color;
    createCollision({ isDynamicBody }: {
        isDynamicBody?: boolean | undefined;
    }): void;
}
