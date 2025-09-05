import { DestroyFunction } from "../core/base-node-life-cycle";
export declare function destroyEntity<T>(entity: T, globals: any, destroyFunction: DestroyFunction<T>): void;
export declare function destroy(entity: any, globals?: any): void;
