/**
 * `@zylem/game-lib/placement` public API.
 *
 * Hover areas, droppable areas, and the cursor representative used to place
 * entities during play. Arm a session with `stage.armPlacement(...)` from
 * `@zylem/game-lib/core`.
 * @public
 */
export {
	createHoverArea,
	createDroppableArea,
	ZylemHoverArea,
	ZylemDroppableArea,
	HOVER_AREA_TYPE,
	DROPPABLE_AREA_TYPE,
} from '../lib/entities/hover-area';

export { entityRepresentative } from '../lib/stage/entity-representative';
export type {
	EntityRepresentative,
	EntityRepresentativeOptions,
	RepresentativeFrame,
	RepresentativeLook,
	RepresentativeSource,
} from '../lib/stage/entity-representative';

export type {
	HoverAreaOptions,
	DroppableAreaOptions,
	PointerAreaContext,
	PlacementPointContext,
	PointerTargetEntity,
} from '../lib/stage/pointer-target';

export type {
	ArmPlacementOptions,
	PlacementSession,
} from '../lib/stage/placement-session';
