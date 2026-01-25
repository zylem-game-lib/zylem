import { Color, Vector3 } from 'three';
import { standardShader } from '../graphics/shaders/standard.shader';
import { GameEntityOptions } from './entity';

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
