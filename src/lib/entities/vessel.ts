import { DestroyFunction } from "../core/destroy";
import { SetupFunction } from "../core/setup";
import { UpdateFunction } from "../core/update";

abstract class Vessel {
	protected parent: Vessel | null = null;
	protected children: Vessel[] = [];

	public setParent(parent: Vessel | null): void {
		this.parent = parent;
	}

	public getParent(): Vessel | null {
		return this.parent;
	}

	public add(vessel: Vessel): void {
		this.children.push(vessel);
		vessel.setParent(this);
	}

	public remove(vessel: Vessel): void {
		const index = this.children.indexOf(vessel);
		if (index !== -1) {
			this.children.splice(index, 1);
			vessel.setParent(null);
		}
	}

	public isComposite(): boolean {
		return true;
	}

	public abstract operation(): string;

	public setup(): void {
		this.children.forEach(child => child.setup());
	}

	public update(): void {
		this.children.forEach(child => child.update());
	}

	public destroy(): void {
		this.children.forEach(child => child.destroy());
	}
}


export interface ChildVessel<U = object> {
	options?: U;
	children?: ChildVessel<U>[];
	update?: (params: any) => void;
	setup?: (params: any) => void;
	destroy?: () => void;
}

export interface VesselFunction<T extends Vessel<U>, U extends ChildVessel<object> = object> {
	(): T;
	(options: U): T;
	(...children: ChildVessel<U>[]): Vessel<U>;
}

export function vessel<T extends Vessel>(...args: Array<T | Partial<T['options']>>): T {
	const vessel: T = {
		children: [],
		update: () => { },
		setup: () => { },
		destroy: () => { },
	} as unknown as T;

	for (const arg of args) {
		if ('children' in arg) {
			vessel.add(arg as T);
		} else {
			vessel.options = { ...vessel.options, ...(arg as Partial<T['options']>) };
		}
	}

	return vessel;
}

export class ZylemVessel extends Vessel {
	nodes: ZylemVessel[] = [];
	setup: SetupFunction<ZylemVessel> = () => { };
	update: UpdateFunction<ZylemVessel> = () => { };
	destroy: DestroyFunction<ZylemVessel> = () => { };
}