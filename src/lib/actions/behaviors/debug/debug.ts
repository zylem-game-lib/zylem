import { BaseNode } from "../../../core/base-node";
import { BehaviorContext, BehaviorCallback } from "../../../entities/entity";

export interface DebugBehaviorOptions {
	message: string;
}

const defaultDebugBehaviorOptions: DebugBehaviorOptions = {
	message: 'Debug behavior',
};

export function debugBehavior(options: Partial<DebugBehaviorOptions> = {}): { type: 'update', handler: BehaviorCallback<BaseNode, any> } {
	return {
		type: 'update',
		handler: (behaviorContext: BehaviorContext<BaseNode, any>) => {
			_debugBehavior(behaviorContext, options);
		}
	};
}

function _debugBehavior(behaviorContext: BehaviorContext<BaseNode, any>, options: Partial<DebugBehaviorOptions>) {
	const { message } = { ...defaultDebugBehaviorOptions, ...options };
	console.log(message, behaviorContext);
}