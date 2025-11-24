import { Color, Vector3 as ThreeVector3 } from 'three';
import { Vector3 } from '@dimforge/rapier3d-compat';

// TODO: needs implementations
/**
 * @deprecated This type is deprecated.
 */
export type Vect3 = ThreeVector3 | Vector3;

export const ZylemBlueColor = new Color('#0333EC');
const ZylemBlue = '#0333EC';
const ZylemBlueTransparent = '#0333ECA0';
const ZylemGoldText = '#DAA420';

type SizeVector = Vect3 | null;

const Vec0 = new Vector3(0, 0, 0);
const Vec1 = new Vector3(1, 1, 1);