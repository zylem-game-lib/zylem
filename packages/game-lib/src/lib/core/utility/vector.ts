import { Color } from 'three';
import { Vector3 } from '@dimforge/rapier3d-compat';
import type { Vec3 } from '../vector';
import { VEC3_ONE, VEC3_ZERO } from '../vector';

/**
 * @deprecated Use Vec3 from ../vector instead.
 */
export type Vect3 = Vec3;

export const ZylemBlueColor = new Color('#0333EC');
export const ZylemBlue = '#0333EC';
export const ZylemBlueTransparent = '#0333ECA0';
export const ZylemGoldText = '#DAA420';

export const Vec0 = new Vector3(VEC3_ZERO.x, VEC3_ZERO.y, VEC3_ZERO.z);
export const Vec1 = new Vector3(VEC3_ONE.x, VEC3_ONE.y, VEC3_ONE.z);
