import { RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { Color } from "three";
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
