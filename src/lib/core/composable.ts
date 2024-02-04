export type Constructor = new (...args: any[]) => {};

export function applyMixins(derivedCtor: any, constructors: any[]) {
	constructors.forEach((baseCtor) => {
		Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
			Object.defineProperty(
				derivedCtor.prototype,
				name,
				Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ||
				Object.create(null)
			);
		});
	});
}

export type With<BaseType, ObjectKey extends string, ComposedType> = BaseType & { [k in ObjectKey]: ComposedType };