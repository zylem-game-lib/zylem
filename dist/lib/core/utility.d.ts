import { Color, Vector3 as ThreeVector3 } from 'three';
import { Vector3 } from '@dimforge/rapier3d-compat';
/**
 * @deprecated This type is deprecated.
 */
export type Vect3 = ThreeVector3 | Vector3;
export declare const ZylemBlueColor: Color;
export declare const ZylemBlue = "#0333EC";
export declare const ZylemBlueTransparent = "#0333ECA0";
export declare const ZylemGoldText = "#DAA420";
export type SizeVector = Vect3 | null;
export declare function sortedStringify(obj: Record<string, any>): string;
export declare function shortHash(objString: string): string;
export declare const Vec0: Vector3;
export declare const Vec1: Vector3;
