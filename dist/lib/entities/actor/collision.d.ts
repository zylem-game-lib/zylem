import { ColliderDesc } from "@dimforge/rapier3d-compat";
import { Object3D } from "three";
import { BaseCollision } from "~/lib/collision/collision";
export declare class ActorCollision extends BaseCollision {
    height: number;
    radius: number;
    createCollision({ isDynamicBody, object }: {
        isDynamicBody: boolean;
        object: Object3D | null;
    }): void;
    createCollider(isSensor?: boolean): ColliderDesc;
}
