import { BaseEntity, BaseEntityOptions } from "../core/base-entity";

interface Vessel {
	children: BaseEntity[];
	options: BaseEntityOptions;
}

export class ZylemVessel extends BaseEntity<{}> {
	create(): Vessel {
		return {
			children: this.children,
			options: this.options
		}
	}
}

export function vessel(...args: Array<BaseEntity | Partial<{}>>): Vessel {
    const instance = new ZylemVessel();
    
    for (const arg of args) {
        if (arg instanceof BaseEntity) {
            instance.add(arg);
        } else {
            instance.setOptions(arg as Partial<{}>);
        }
    }

    return instance.create();
}
