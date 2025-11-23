export declare function isLoadable(obj: any): obj is EntityLoaderDelegate;
export interface EntityLoaderDelegate {
    load(): Promise<void>;
    data(): any;
}
export declare class EntityLoader {
    entityReference: EntityLoaderDelegate;
    constructor(entity: EntityLoaderDelegate);
    load(): Promise<void>;
    data(): Promise<any>;
}
//# sourceMappingURL=loader.d.ts.map