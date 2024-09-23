export type Constructor = new (...args: any[]) => {};

export function applyMixins(derivedCtor: any, mixins: any[]) {
    for (const mixin of mixins) {
        Object.getOwnPropertyNames(mixin.prototype).forEach(name => {
            derivedCtor.prototype[name] = mixin.prototype[name];
        });
    }
}

export type With<BaseType, ObjectKey extends string, ComposedType> = BaseType & { [k in ObjectKey]: ComposedType };