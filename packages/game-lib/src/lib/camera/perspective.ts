export const Perspectives = {
	FirstPerson: 'first-person',
	ThirdPerson: 'third-person',
	Isometric: 'isometric',
	Flat2D: 'flat-2d',
	Fixed2D: 'fixed-2d',
} as const;

export type PerspectiveType = (typeof Perspectives)[keyof typeof Perspectives];