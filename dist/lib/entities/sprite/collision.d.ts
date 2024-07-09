import { ColliderDesc } from "@dimforge/rapier3d-compat";
import { Vector3 } from "three";
import { BaseCollision } from "~/lib/collision/collision";
export declare class SpriteCollision extends BaseCollision {
    collisionSize: Vector3;
    size: Vector3;
    createCollision({ isDynamicBody, isSensor }: {
        isDynamicBody?: boolean | undefined;
        isSensor?: boolean | undefined;
    }): void;
    createCollider(isSensor?: boolean): ColliderDesc;
}
