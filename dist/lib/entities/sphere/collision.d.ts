import { ColliderDesc } from "@dimforge/rapier3d-compat";
import { BaseCollision } from "~/lib/collision/collision";
export declare class SphereCollision extends BaseCollision {
    _collisionRadius: number;
    createCollider(isSensor?: boolean): ColliderDesc;
}
