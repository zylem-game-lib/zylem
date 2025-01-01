import { Behavior } from "~/lib/behaviors/behavior";

export type BaseNodeOptions<T = any> = BaseNode | Partial<T>;

export abstract class BaseNode<Options = any, T = any> {
	protected parent: BaseNode | null = null;
	protected children: BaseNode[] = [];
	public behaviors: Behavior[] = [];
	public options: Options;

	constructor(args: BaseNodeOptions[] = []) {
		const options = args
			.filter(arg => !(arg instanceof BaseNode))
			.reduce((acc, opt) => ({ ...acc, ...opt }), {});
		this.options = options as Options;
	}

	public setParent(parent: BaseNode | null): void {
		this.parent = parent;
	}

	public getParent(): BaseNode | null {
		return this.parent;
	}

	public add(baseNode: BaseNode): void {
		this.children.push(baseNode);
		baseNode.setParent(this);
	}

	public remove(baseNode: BaseNode): void {
		const index = this.children.indexOf(baseNode);
		if (index !== -1) {
			this.children.splice(index, 1);
			baseNode.setParent(null);
		}
	}

	public isComposite(): boolean {
		return this.children.length > 0;
	}

	public abstract create(): T;

	protected baseSetup() {

	}

	public setup(): void {
		this.children.forEach(child => child.setup());
	}

	public update({ entity }: { entity: any }): void {
		this.children.forEach(child => child.update({ entity }));
	}

	public destroy(): void {
		this.children.forEach(child => child.destroy());
	}

	public getOptions(): Options {
		return this.options;
	}

	public setOptions(options: Partial<Options>): void {
		this.options = { ...this.options, ...options };
	}
}