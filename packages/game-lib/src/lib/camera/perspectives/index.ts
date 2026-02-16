import type { PerspectiveType } from '../perspective';
import type { CameraPerspective } from '../types';
import { ThirdPersonPerspective } from './third-person-perspective';
import type { ThirdPersonOptions } from './third-person-perspective';
import { Fixed2DPerspective } from './fixed-2d-perspective';
import type { Fixed2DOptions } from './fixed-2d-perspective';

export { ThirdPersonPerspective } from './third-person-perspective';
export type { ThirdPersonOptions } from './third-person-perspective';
export { Fixed2DPerspective } from './fixed-2d-perspective';
export type { Fixed2DOptions } from './fixed-2d-perspective';

/**
 * Perspective-specific options union.
 * Extend as new perspective types are added.
 */
export type PerspectiveOptions = ThirdPersonOptions | Fixed2DOptions;

/**
 * Factory: create a CameraPerspective from a PerspectiveType string.
 * Unrecognized types default to ThirdPersonPerspective.
 */
export function createPerspective(
	type: PerspectiveType,
	options?: PerspectiveOptions
): CameraPerspective {
	switch (type) {
		case 'third-person':
			return new ThirdPersonPerspective(options as ThirdPersonOptions);
		case 'first-person':
			// First person placeholder -- reuse third-person with tight distance
			return new ThirdPersonPerspective({
				distance: 0,
				height: 0,
				...(options as ThirdPersonOptions),
			});
		case 'isometric':
			// Isometric placeholder -- fixed angle third-person
			return new ThirdPersonPerspective({
				distance: 10,
				height: 10,
				...(options as ThirdPersonOptions),
			});
		case 'flat-2d':
			return new Fixed2DPerspective(options as Fixed2DOptions);
		case 'fixed-2d':
			return new Fixed2DPerspective(options as Fixed2DOptions);
		default:
			return new ThirdPersonPerspective(options as ThirdPersonOptions);
	}
}
