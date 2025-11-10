import { DebugBehaviorOptions } from "~/lib/actions/behaviors/debug/debug";
import { BaseNode } from "~/lib/core/base-node";
import { CollisionContext } from "~/lib/entities/entity";
export type DebugBehaviorCollisionCallback = (ctx: CollisionContext<BaseNode, BaseNode<any>>) => void;
export declare function debugBehaviorCollision(options?: Partial<DebugBehaviorOptions>, ...callbacks: DebugBehaviorCollisionCallback[]): (collisionContext: CollisionContext<any, any>) => void;
//# sourceMappingURL=debug-collision.d.ts.map