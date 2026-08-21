/**
 * `@zylem/game-lib/catalog` public API.
 *
 * The registry of placeable entity types behind the editor's Add palette. Hosts
 * register their own configured entities here so they appear alongside the
 * built-in primitives; only a serializable descriptor is published to the
 * editor, and the factory stays on this side of the bridge.
 * @public
 */
export {
	registerEntityType,
	registerEntityTypes,
	getEntityType,
	listEntityTypes,
	buildCatalogDescriptors,
	onEntityRegistryChanged,
	clearEntityRegistry,
	type EntityTypeRegistration,
	type EntityTypeFactory,
	type EntityPlacementContext,
} from '../lib/entities/entity-registry';

export {
	registerBuiltInEntityTypes,
	BUILT_IN_ENTITY_TYPES,
} from '../lib/entities/entity-catalog';

export type { EntityTypeDescriptor } from '@zylem/bridge';
