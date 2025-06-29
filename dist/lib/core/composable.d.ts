export type Constructor = new (...args: any[]) => {};
export declare function applyMixins(derivedCtor: any, mixins: any[]): void;
export type With<BaseType, ObjectKey extends string, ComposedType> = BaseType & {
    [k in ObjectKey]: ComposedType;
};
