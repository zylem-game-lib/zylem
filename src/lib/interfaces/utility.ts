import { Color, Vector3 as ThreeVector3 } from 'three';
import { Vector3 } from '@dimforge/rapier3d-compat';

// TODO: needs implementations
export type Vect3 = ThreeVector3 | Vector3;

export const ZylemBlueColor = new Color('#3A3EA0');
export const ZylemBlue = '#3A3EA0';
export const ZylemBlueTransparent = '#3A3EA0A0';
export const ZylemGoldText = '#DAA520';

export type SizeVector = Vect3 | null;