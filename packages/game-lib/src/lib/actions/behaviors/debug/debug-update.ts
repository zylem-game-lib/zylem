import { BaseNode } from "~/lib/core/base-node";
import { UpdateContext } from "~/lib/core/base-node-life-cycle";
import { DebugBehaviorOptions } from "~/lib/actions/behaviors/debug/debug";

const defaultDebugUpdateBehaviorOptions: DebugBehaviorOptions = {
	message: 'Debug update behavior',
};

export function debugUpdateBehavior(
	options: Partial<DebugBehaviorOptions> = {}
) {
	return (updateContext: UpdateContext<BaseNode>) => {
		_debugUpdateBehavior(updateContext, options);
	};
}

function _debugUpdateBehavior(updateContext: UpdateContext<BaseNode>, options: Partial<DebugBehaviorOptions>) {
	const { message } = { ...defaultDebugUpdateBehaviorOptions, ...options };
	console.log(message, updateContext);
}