/**
 * `@zylem/game-lib/entity` public API.
 * @public
 */
// Entity factories
export { createBox, ZylemBox, BOX_TYPE } from '../lib/entities/box';
export { createSphere, ZylemSphere, SPHERE_TYPE } from '../lib/entities/sphere';
export { createSprite, ZylemSprite, SPRITE_TYPE } from '../lib/entities/sprite';
export type { SpriteImage, SpriteAnimation } from '../lib/entities/sprite';
export { createPlane, ZylemPlane, PLANE_TYPE } from '../lib/entities/plane';
export { createZone, ZylemZone, ZONE_TYPE } from '../lib/entities/zone';
export type { OnHeldParams, OnEnterParams, OnExitParams } from '../lib/entities/zone';
export { createActor, ZylemActor, ACTOR_TYPE } from '../lib/entities/actor';
export type { CollisionShapeType } from '../lib/entities/actor';
export { createText, ZylemText, TEXT_TYPE } from '../lib/entities/text';
export { createRect, ZylemRect, RECT_TYPE } from '../lib/entities/rect';
export { createDisk, ZylemDisk, DISK_TYPE } from '../lib/entities/disk';
export { createCone, ZylemCone, CONE_TYPE } from '../lib/entities/cone';
export { createPyramid, ZylemPyramid, PYRAMID_TYPE } from '../lib/entities/pyramid';
export { createCylinder, ZylemCylinder, CYLINDER_TYPE } from '../lib/entities/cylinder';
export { createPill, ZylemPill, PILL_TYPE } from '../lib/entities/pill';
export {
	createParticleSystem,
	ZylemParticleSystem,
	PARTICLE_SYSTEM_TYPE,
} from '../lib/entities/particle-system';
export type { ZylemParticleSystemOptions } from '../lib/entities/particle-system';
export { createLight, ZylemLight, LIGHT_TYPE } from '../lib/entities/light';
export type {
	ZylemLightOptions,
	AmbientLightOptions,
	HemisphereLightOptions,
	DirectionalLightOptions,
	PointLightOptions,
	SpotLightOptions,
	LightShadowOptions,
} from '../lib/entities/light';
export { createFog, ZylemFog, FOG_TYPE } from '../lib/entities/fog';
export { createLine, ZylemLine, LINE_TYPE, pickZylemLine } from '../lib/entities/line';
export type { ZylemLineOptions, LinePickResult } from '../lib/entities/line';
export type {
	ZylemFogOptions,
	ZylemFogType,
	ZylemFogHeightOptions,
	ZylemFogNoiseOptions,
} from '../lib/entities/fog';

// Entity primitives & utilities
export { create } from '../lib/entities/entity';
export { createEntity } from '../lib/entities/create';
export { createEntityFactory, type TemplateFactory } from '../lib/entities/entity-factory';
export type { GameEntity, GameEntityOptions } from '../lib/entities/entity';
export {
	createCooldownIcon,
	type IconSize,
	type IconSizePreset,
	type ScreenAnchor,
} from '../lib/entities/cooldown-icon';
export { destroy } from '../lib/entities/destroy';

// Component factories for composable entity API
export {
	boxMesh,
	sphereMesh,
	coneMesh,
	pyramidMesh,
	cylinderMesh,
	pillMesh,
	boxCollision,
	sphereCollision,
	coneCollision,
	pyramidCollision,
	cylinderCollision,
	pillCollision,
	planeCollision,
	zoneCollision,
	type CollisionComponent,
} from '../lib/entities/parts';

// Entity type symbols (consolidated map for getEntityByName type inference)
export type { EntityTypeMap, EntityForType } from '../lib/types/entity-type-map';
