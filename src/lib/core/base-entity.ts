export type BaseEntityOptions<T = any> = BaseEntity | Partial<T>;

export abstract class BaseEntity<Options = any, T = any> {
    protected parent: BaseEntity | null = null;
    protected children: BaseEntity[] = [];
    protected options: Options;

	constructor(args: BaseEntityOptions[] = []) {
		const options = args
			.filter(arg => !(arg instanceof BaseEntity))
            .reduce((acc, opt) => ({ ...acc, ...opt }), {});
		this.options = options as Options;
	}

	public setParent(parent: BaseEntity | null): void {
		this.parent = parent;
	}

	public getParent(): BaseEntity | null {
		return this.parent;
	}

	public add(baseEntity: BaseEntity): void {
		this.children.push(baseEntity);
		baseEntity.setParent(this);
	}

	public remove(baseEntity: BaseEntity): void {
		const index = this.children.indexOf(baseEntity);
		if (index !== -1) {
			this.children.splice(index, 1);
			baseEntity.setParent(null);
		}
	}

	public isComposite(): boolean {
        return this.children.length > 0;
    }

	public abstract create(): T;

	public setup(): void {
		this.children.forEach(child => child.setup());
	}

	public update(): void {
		this.children.forEach(child => child.update());
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