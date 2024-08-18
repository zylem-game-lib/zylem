import { ColliderDesc } from "@dimforge/rapier3d-compat";
import { BaseCollision } from "~/lib/collision/_oldCollision";
export declare class PlaneCollision extends BaseCollision {
    createCollider(isSensor?: boolean): ColliderDesc;
}
