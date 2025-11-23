import { UpdateContext } from "../core/base-node-life-cycle";
/**
 * Listen for a single global key change inside an onUpdate pipeline.
 * Usage: onUpdate(globalChange('p1Score', (value) => { ... }))
 */
export declare function globalChange<T = any>(key: string, callback: (value: T, ctx: UpdateContext<any>) => void): (ctx: UpdateContext<any>) => void;
/**
 * Listen for multiple global key changes inside an onUpdate pipeline.
 * Calls back when any of the provided keys changes.
 * Usage: onUpdate(globalChanges(['p1Score','p2Score'], ([p1,p2]) => { ... }))
 */
export declare function globalChanges<T = any>(keys: string[], callback: (values: T[], ctx: UpdateContext<any>) => void): (ctx: UpdateContext<any>) => void;
/**
 * Listen for a single stage variable change inside an onUpdate pipeline.
 * Usage: onUpdate(variableChange('score', (value, ctx) => { ... }))
 */
export declare function variableChange<T = any>(key: string, callback: (value: T, ctx: UpdateContext<any>) => void): (ctx: UpdateContext<any>) => void;
/**
 * Listen for multiple stage variable changes; fires when any changes.
 * Usage: onUpdate(variableChanges(['a','b'], ([a,b], ctx) => { ... }))
 */
export declare function variableChanges<T = any>(keys: string[], callback: (values: T[], ctx: UpdateContext<any>) => void): (ctx: UpdateContext<any>) => void;
//# sourceMappingURL=global-change.d.ts.map