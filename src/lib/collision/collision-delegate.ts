
export function isCollisionHandlerDelegate(obj: any): obj is CollisionHandlerDelegate {
	return typeof obj?.handlePostCollision === "function" && typeof obj?.handleIntersectionEvent === "function";
}

export interface CollisionHandlerDelegate {
	handlePostCollision(params: any): boolean;
	handleIntersectionEvent(params: any): void;
}

export class CollisionHandler {
	entityReference: CollisionHandlerDelegate;

	constructor(entity: CollisionHandlerDelegate) {
		this.entityReference = entity;
	}

	handlePostCollision(params: any): boolean {
		return this.entityReference.handlePostCollision(params);
	}

	handleIntersectionEvent(params: any) {
		this.entityReference.handleIntersectionEvent(params);
	}
}
