import { createSphere } from '@zylem/game-lib/entity';
import {
	buildCatalogDescriptors,
	registerEntityType,
	registerBuiltInEntityTypes,
} from '@zylem/game-lib/catalog';

export function setupCatalog() {
	registerBuiltInEntityTypes();
	registerEntityType({
		id: 'hero',
		label: 'Hero',
		group: 'Characters',
		tags: ['player'],
		defaultProps: { radius: 0.5 },
		create: ({ position, props }) =>
			createSphere({
				name: 'hero',
				position,
				radius: (props.radius as number) ?? 0.5,
			}),
	});
	return buildCatalogDescriptors();
}
