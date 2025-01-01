import { Color, Vector3 as ThreeVector3 } from 'three';
import { Vector3 } from '@dimforge/rapier3d-compat';

// TODO: needs implementations
/**
 * @deprecated This type is deprecated.
 */
export type Vect3 = ThreeVector3 | Vector3;

export const ZylemBlueColor = new Color('#0333EC');
export const ZylemBlue = '#0333EC';
export const ZylemBlueTransparent = '#0333ECA0';
export const ZylemGoldText = '#DAA420';

export type SizeVector = Vect3 | null;

export function sortedStringify(obj: Record<string, any>) {
	const sortedObj = Object.keys(obj)
		.sort()
		.reduce((acc: Record<string, any>, key: string) => {
			acc[key] = obj[key];
			return acc;
		}, {} as Record<string, any>);

	return JSON.stringify(sortedObj);
}

export function shortHash(objString: string) {
	let hash = 0;
	for (let i = 0; i < objString.length; i++) {
		hash = Math.imul(31, hash) + objString.charCodeAt(i) | 0;
	}
	return hash.toString(36);
}