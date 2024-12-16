import { DestroyFunction } from "../core/destroy";
import { SetupFunction } from "../core/setup";
import { UpdateFunction } from "../core/update";

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

export function vessel<T extends Node>(...args: Array<T | Partial<T['options']>>): T {
	const vessel: T = {
		children: [],
		update: () => { },
		setup: () => { },
		destroy: () => { },
	} as unknown as T;

	for (const arg of args) {
		if ('children' in arg) {
			vessel.children = vessel.children || [];
			vessel.children.push(arg as T);
		} else {
			vessel.options = { ...vessel.options, ...(arg as Partial<T['options']>) };
		}
	}

	return vessel;
}

export class ZylemVessel {
	nodes: ZylemVessel[] = [];
	setup: SetupFunction<ZylemVessel> = () => { };
	update: UpdateFunction<ZylemVessel> = () => { };
	destroy: DestroyFunction<ZylemVessel> = () => { };
}