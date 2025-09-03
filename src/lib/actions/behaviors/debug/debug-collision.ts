import { DebugBehaviorOptions } from "~/lib/actions/behaviors/debug/debug";
import { BaseNode } from "~/lib/core/base-node";
import { CollisionContext } from "~/lib/entities/entity";

export type DebugBehaviorCollisionCallback = (ctx: CollisionContext<BaseNode, BaseNode<any>>) => void;

const defaultDebugBehaviorOptions: DebugBehaviorOptions = {
	message: 'Debug behavior collision',
};

export function debugBehaviorCollision(
	options: Partial<DebugBehaviorOptions> = {},
	...callbacks: DebugBehaviorCollisionCallback[]
) {
	return (collisionContext: CollisionContext<any, any>) => {
		_debugBehaviorCollision(
			collisionContext as CollisionContext<BaseNode, BaseNode<any>>,
			options,
			callbacks
		);
	};
}

function _debugBehaviorCollision(collisionContext: CollisionContext<BaseNode, BaseNode<any>>, options: Partial<DebugBehaviorOptions>, callbacks: DebugBehaviorCollisionCallback[]) {
	const { message } = { ...defaultDebugBehaviorOptions, ...options };
	console.log(message, collisionContext, callbacks);
}