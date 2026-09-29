import type { PerspectiveType } from '../perspective';
import type { CameraPerspective } from '../types';
import { ThirdPersonPerspective } from './third-person-perspective';
import type { ThirdPersonOptions } from './third-person-perspective';
import { Fixed2DPerspective } from './fixed-2d-perspective';
import type { Fixed2DOptions } from './fixed-2d-perspective';
import { FirstPersonPerspective } from './first-person-perspective';
import type { FirstPersonOptions } from './first-person-perspective';
import { IsometricPerspective } from './isometric-perspective';
import type { IsometricOptions } from './isometric-perspective';
import { TopDownPerspective } from './top-down-perspective';
import type { TopDownOptions } from './top-down-perspective';
import { SecondPersonPerspective } from './second-person-perspective';
import type { SecondPersonOptions } from './second-person-perspective';

export { ThirdPersonPerspective } from './third-person-perspective';
export type { ThirdPersonOptions } from './third-person-perspective';
export { Fixed2DPerspective } from './fixed-2d-perspective';
export type { Fixed2DOptions } from './fixed-2d-perspective';
export { FirstPersonPerspective } from './first-person-perspective';
export type { FirstPersonOptions } from './first-person-perspective';
export { IsometricPerspective } from './isometric-perspective';
export type { IsometricOptions } from './isometric-perspective';
export { TopDownPerspective } from './top-down-perspective';
export type { TopDownOptions } from './top-down-perspective';
export { SecondPersonPerspective } from './second-person-perspective';
export type { SecondPersonOptions } from './second-person-perspective';

/**
 * Perspective-specific options union.
 * Extend as new perspective types are added.
 */
export type PerspectiveOptions =
	| ThirdPersonOptions
	| Fixed2DOptions
	| FirstPersonOptions
	| IsometricOptions
	| TopDownOptions
	| SecondPersonOptions;

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
			return new FirstPersonPerspective(options as FirstPersonOptions);
		case 'second-person':
			return new SecondPersonPerspective(options as SecondPersonOptions);
		case 'isometric':
			return new IsometricPerspective(options as IsometricOptions);
		case 'top-down':
			return new TopDownPerspective(options as TopDownOptions);
		case 'flat-2d':
			return new Fixed2DPerspective(options as Fixed2DOptions);
		case 'fixed-2d':
			return new Fixed2DPerspective(options as Fixed2DOptions);
		default:
			return new ThirdPersonPerspective(options as ThirdPersonOptions);
	}
}
