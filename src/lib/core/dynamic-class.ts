export class DynamicClass {
    extend<D extends DynamicClass>(domain: D) {
        const that = this;
        const ThisClassProto = Object.getPrototypeOf(this);
        const DomainClassProto = Object.getPrototypeOf(domain);

        class ExtendedClass {
            constructor() {
                Object.assign(this, that);
                Object.assign(this, domain);
            }
        }

        for (const propertyName of Object.getOwnPropertyNames(ThisClassProto)) {
            (ExtendedClass.prototype as any)[propertyName] = ThisClassProto[propertyName];
        }

        for (const propertyName of Object.getOwnPropertyNames(DomainClassProto)) {
            (ExtendedClass.prototype as any)[propertyName] = DomainClassProto[propertyName];
        }

        const extended = new ExtendedClass() as typeof this & D;

        Object.assign(extended, this, domain);

        return extended;
    }
}