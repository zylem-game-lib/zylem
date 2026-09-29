import type { CameraProjection } from './types';

export const Perspectives = {
	FirstPerson: 'first-person',
	ThirdPerson: 'third-person',
	SecondPerson: 'second-person',
	Isometric: 'isometric',
	Flat2D: 'flat-2d',
	Fixed2D: 'fixed-2d',
	TopDown: 'top-down',
} as const;

export type PerspectiveType = (typeof Perspectives)[keyof typeof Perspectives];

/** Projection a perspective type commits onto. */
export function perspectiveProjection(type: PerspectiveType): CameraProjection {
	switch (type) {
		case Perspectives.Isometric:
		case Perspectives.TopDown:
		case Perspectives.Flat2D:
		case Perspectives.Fixed2D:
			return 'orthographic';
		default:
			return 'perspective';
	}
}
