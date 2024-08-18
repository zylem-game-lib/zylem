import { ColliderDesc } from "@dimforge/rapier3d-compat";
import { BaseCollision } from "~/lib/collision/_oldCollision";
import { SizeVector } from "~/lib/interfaces/utility";
export declare class ZoneCollision extends BaseCollision {
    _size: SizeVector;
    createCollider(_isSensor?: boolean): ColliderDesc;
}
