export declare function isCollisionHandlerDelegate(obj: any): obj is CollisionHandlerDelegate;
export interface CollisionHandlerDelegate {
    handlePostCollision(params: any): boolean;
    handleIntersectionEvent(params: any): void;
}
export declare class CollisionHandler {
    entityReference: CollisionHandlerDelegate;
    constructor(entity: CollisionHandlerDelegate);
    handlePostCollision(params: any): boolean;
    handleIntersectionEvent(params: any): void;
}
//# sourceMappingURL=collision-delegate.d.ts.map