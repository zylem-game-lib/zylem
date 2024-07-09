import { ColliderDesc } from "@dimforge/rapier3d-compat";
import { BaseCollision } from "~/lib/collision/collision";
import { SizeVector } from "~/lib/interfaces/utility";
export declare class BoxCollision extends BaseCollision {
    _size: SizeVector;
    createCollider(isSensor?: boolean): ColliderDesc;
}
