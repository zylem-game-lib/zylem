import { ZylemSprite, SPRITE_TYPE } from '../entities/sprite';
import { ZylemSphere, SPHERE_TYPE } from '../entities/sphere';
import { ZylemRect, RECT_TYPE } from '../entities/rect';
import { ZylemText, TEXT_TYPE } from '../entities/text';
import { ZylemBox, BOX_TYPE } from '../entities/box';
import { ZylemPlane, PLANE_TYPE } from '../entities/plane';
import { ZylemZone, ZONE_TYPE } from '../entities/zone';
import { ZylemActor, ACTOR_TYPE } from '../entities/actor';
import { ZylemDisk, DISK_TYPE } from '../entities/disk';
import { ZylemCone, CONE_TYPE } from '../entities/cone';
import { ZylemPyramid, PYRAMID_TYPE } from '../entities/pyramid';
import { ZylemCylinder, CYLINDER_TYPE } from '../entities/cylinder';
import { ZylemPill, PILL_TYPE } from '../entities/pill';
import { BaseNode } from '../core/base-node';

/**
 * Maps entity type symbols to their class types.
 * Used by getEntityByName to infer return types.
 */
export interface EntityTypeMap {
	[SPRITE_TYPE]: ZylemSprite;
	[SPHERE_TYPE]: ZylemSphere;
	[RECT_TYPE]: ZylemRect;
	[TEXT_TYPE]: ZylemText;
	[BOX_TYPE]: ZylemBox;
	[PLANE_TYPE]: ZylemPlane;
	[ZONE_TYPE]: ZylemZone;
	[ACTOR_TYPE]: ZylemActor;
	[DISK_TYPE]: ZylemDisk;
	[CONE_TYPE]: ZylemCone;
	[PYRAMID_TYPE]: ZylemPyramid;
	[CYLINDER_TYPE]: ZylemCylinder;
	[PILL_TYPE]: ZylemPill;
}

/**
 * Type helper: if T is a known type symbol, return the mapped entity type.
 * Otherwise return BaseNode.
 */
export type EntityForType<T> = T extends keyof EntityTypeMap
	? EntityTypeMap[T]
	: BaseNode;

// Re-export type symbols for convenience
export {
	SPRITE_TYPE,
	SPHERE_TYPE,
	RECT_TYPE,
	TEXT_TYPE,
	BOX_TYPE,
	PLANE_TYPE,
	ZONE_TYPE,
	ACTOR_TYPE,
	DISK_TYPE,
	CONE_TYPE,
	PYRAMID_TYPE,
	CYLINDER_TYPE,
	PILL_TYPE,
};
