export declare function isCollisionHandlerDelegate(obj: any): obj is CollisionHandlerDelegate;
export interface CollisionHandlerDelegate {
    handlePostCollision(params: any): boolean;
    handleIntersectionEvent(params: any): void;
}
//# sourceMappingURL=collision-delegate.d.ts.map