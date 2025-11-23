import { BaseNode } from "../../../core/base-node";
import { BehaviorCallback } from "../../../entities/entity";
export interface DebugBehaviorOptions {
    message: string;
}
export declare function debugBehavior(options?: Partial<DebugBehaviorOptions>): {
    type: 'update';
    handler: BehaviorCallback<BaseNode, any>;
};
//# sourceMappingURL=debug.d.ts.map