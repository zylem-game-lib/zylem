import { Color, Vector3 } from 'three';
import { standardShader } from '../graphics/shaders/standard.shader';
import { GameEntityOptions } from './entity';
import { BaseNode } from '../core/base-node';

export const commonDefaults: Partial<GameEntityOptions> = {
    position: new Vector3(0, 0, 0),
    material: {
        color: new Color('#ffffff'),
        shader: standardShader
    },
    collision: {
        static: false,
    },
};

/**
 * Merge a variadic args array (BaseNode children + options object) with defaults.
 * Returns the merged options. This replaces the createEntity() arg parsing logic.
 */
export function mergeArgs<T extends GameEntityOptions>(
    args: Array<BaseNode | Partial<T>>,
    defaults: Partial<T>,
): T {
    const configArgs = args.filter(
        (arg): arg is Partial<T> => !(arg instanceof BaseNode),
    );
    let merged: Partial<T> = { ...defaults };
    for (const opt of configArgs) {
        merged = { ...merged, ...opt };
    }
    return merged as T;
}
