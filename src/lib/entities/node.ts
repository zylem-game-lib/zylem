import { DestroyFunction } from "../core/destroy";
import { SetupFunction } from "../core/setup";
import { UpdateFunction } from "../core/update";

// Consider changing name to "thing" instead of "node"

export interface ChildNode<U = object> {
	options?: U;
	children?: ChildNode<U>[];
	update?: (params: any) => void;
	setup?: (params: any) => void;
	destroy?: () => void;
}

export interface Node<T extends ChildNode<U> = any, U = object> {
	options?: U;
	children?: T[];
	update?: (params: any) => void;
	setup?: (params: any) => void;
	destroy?: () => void;
}

export interface NodeFunction<T extends Node<U>, U extends ChildNode<object> = object> {
	(): T;
	(options: U): T;
	(...children: ChildNode<U>[]): Node<U>;
}

export function node<T extends Node>(...args: Array<T | Partial<T['options']>>): T {
	const node: T = {
		children: [],
		update: () => { },
		setup: () => { },
		destroy: () => { },
	} as unknown as T;

	for (const arg of args) {
		if ('children' in arg) {
			node.children = node.children || [];
			node.children.push(arg as T);
		} else {
			node.options = { ...node.options, ...(arg as Partial<T['options']>) };
		}
	}

	return node;
}

export class ZylemNode {
	nodes: ZylemNode[] = [];
	setup: SetupFunction<ZylemNode> = () => { };
	update: UpdateFunction<ZylemNode> = () => { };
	destroy: DestroyFunction<ZylemNode> = () => { };
}