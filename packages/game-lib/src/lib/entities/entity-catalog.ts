/**
 * The built-in placeable entity types offered by the editor's Add palette.
 *
 * Only types that can be placed with a click and no external assets are listed.
 * Actors and sprites need a model or spritesheet, and fog is a global stage
 * effect with no position, so none of them are meaningful to drop into a scene
 * at a point. A host can still register them itself once it has the assets.
 *
 * Icons are inline SVG markup rather than an icon-set name. The editor and its
 * hosts do not share an icon library — the editor uses lucide, Creator has its
 * own hand-rolled glyph registry — so shipping the markup with the descriptor is
 * what lets a Creator-registered entity look right in the palette.
 */

import { Vector3 } from 'three';
import type { EntityTypeRegistration } from './entity-registry';
import { registerEntityTypes } from './entity-registry';
import { createBox } from './box';
import { createSphere } from './sphere';
import { createCone } from './cone';
import { createPyramid } from './pyramid';
import { createCylinder } from './cylinder';
import { createPill } from './pill';
import { createDisk } from './disk';
import { createPlane } from './plane';
import { createZone } from './zone';
import { createRect } from './rect';
import { createLight } from './light';

const SVG_OPEN =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" '
	+ 'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" '
	+ 'stroke-linejoin="round">';

function icon(body: string): string {
	return `${SVG_OPEN}${body}</svg>`;
}

const ICONS = {
	box: icon(
		'<path d="M12 2.5 21 7v10l-9 4.5L3 17V7z"/><path d="M3 7l9 4.5L21 7"/>'
		+ '<path d="M12 11.5v10"/>',
	),
	sphere: icon('<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="9" ry="3.5"/>'),
	cone: icon('<path d="M12 3 20 18H4z"/><ellipse cx="12" cy="18" rx="8" ry="3"/>'),
	pyramid: icon('<path d="M12 3 21 19H3z"/><path d="M12 3v16"/><path d="M3 19l9-5 9 5"/>'),
	cylinder: icon(
		'<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12"/><path d="M19 6v12"/>'
		+ '<ellipse cx="12" cy="18" rx="7" ry="3"/>',
	),
	pill: icon('<rect x="7" y="3" width="10" height="18" rx="5"/><path d="M7 12h10"/>'),
	disk: icon('<ellipse cx="12" cy="12" rx="9" ry="4"/><ellipse cx="12" cy="12" rx="3" ry="1.3"/>'),
	plane: icon('<path d="M2 17 12 11l10 6-10 5z"/><path d="M12 11V4"/>'),
	zone: icon('<rect x="3.5" y="3.5" width="17" height="17" rx="2" stroke-dasharray="3 2.5"/>'),
	rect: icon('<rect x="3.5" y="6" width="17" height="12" rx="1.5"/>'),
	light: icon(
		'<circle cx="12" cy="9" r="4.5"/><path d="M12 2v1.5"/><path d="M12 14.5V22"/>'
		+ '<path d="M4.9 4.9 6 6"/><path d="M19.1 4.9 18 6"/><path d="M2 9h1.5"/>'
		+ '<path d="M20.5 9H22"/>',
	),
} as const;

/** `position` is supplied by the placement click, so it is never a default. */
function shapeRegistration(
	id: string,
	label: string,
	description: string,
	iconMarkup: string,
	create: EntityTypeRegistration['create'],
	tags: string[],
): EntityTypeRegistration {
	return {
		id,
		label,
		description,
		icon: iconMarkup,
		group: 'Shapes',
		tags,
		defaultProps: { size: { x: 1, y: 1, z: 1 } },
		create,
	};
}

function sizeOf(props: Record<string, unknown>): Vector3 {
	const size = props.size as { x?: number; y?: number; z?: number } | undefined;
	return new Vector3(size?.x ?? 1, size?.y ?? 1, size?.z ?? 1);
}

export const BUILT_IN_ENTITY_TYPES: EntityTypeRegistration[] = [
	shapeRegistration(
		'box',
		'Box',
		'Cuboid mesh with a matching box collider.',
		ICONS.box,
		({ position, props }) => createBox({ position, size: sizeOf(props), ...props }),
		['cube', 'block', 'platform', 'wall'],
	),
	shapeRegistration(
		'sphere',
		'Sphere',
		'Ball mesh with a sphere collider.',
		ICONS.sphere,
		({ position, props }) => createSphere({ position, size: sizeOf(props), ...props }),
		['ball', 'orb', 'round'],
	),
	shapeRegistration(
		'cone',
		'Cone',
		'Cone mesh with a cone collider.',
		ICONS.cone,
		({ position, props }) => createCone({ position, size: sizeOf(props), ...props }),
		['spike', 'point'],
	),
	shapeRegistration(
		'pyramid',
		'Pyramid',
		'Four-sided pyramid mesh and collider.',
		ICONS.pyramid,
		({ position, props }) => createPyramid({ position, size: sizeOf(props), ...props }),
		['tetra', 'spike'],
	),
	shapeRegistration(
		'cylinder',
		'Cylinder',
		'Cylinder mesh with a matching collider.',
		ICONS.cylinder,
		({ position, props }) => createCylinder({ position, size: sizeOf(props), ...props }),
		['tube', 'pillar', 'column'],
	),
	shapeRegistration(
		'pill',
		'Pill',
		'Capsule mesh with a capsule collider.',
		ICONS.pill,
		({ position, props }) => createPill({ position, size: sizeOf(props), ...props }),
		['capsule', 'character'],
	),
	shapeRegistration(
		'disk',
		'Disk',
		'Flat cylinder, useful for pucks and platforms.',
		ICONS.disk,
		({ position, props }) => createDisk({ position, size: sizeOf(props), ...props }),
		['puck', 'coin', 'circle'],
	),
	{
		id: 'plane',
		label: 'Plane',
		description: 'Static ground plane with a tiled surface.',
		icon: ICONS.plane,
		group: 'Scene',
		tags: ['ground', 'floor', 'terrain'],
		defaultProps: { size: { x: 10, y: 1, z: 10 } },
		create: ({ position, props }) =>
			createPlane({ position, size: sizeOf(props), ...props }),
	},
	{
		id: 'zone',
		label: 'Zone',
		description: 'Invisible sensor volume that reports overlaps.',
		icon: ICONS.zone,
		group: 'Scene',
		tags: ['trigger', 'sensor', 'area'],
		defaultProps: { size: { x: 2, y: 2, z: 2 } },
		create: ({ position, props }) =>
			createZone({ position, size: sizeOf(props), ...props }),
	},
	{
		id: 'rect',
		label: 'Rect',
		description: 'Flat rectangle for 2D scenes and UI panels.',
		icon: ICONS.rect,
		group: 'Scene',
		tags: ['quad', 'panel', '2d'],
		defaultProps: { size: { x: 1, y: 1, z: 1 } },
		create: ({ position, props }) =>
			createRect({ position, size: sizeOf(props), ...props }),
	},
	{
		id: 'light',
		label: 'Point Light',
		description: 'Point light placed at the click position.',
		icon: ICONS.light,
		group: 'Scene',
		tags: ['lamp', 'illumination'],
		defaultProps: { intensity: 1 },
		create: ({ position, props }) =>
			createLight({ type: 'point', position, ...props } as any),
	},
];

let registered: (() => void) | null = null;

/**
 * Register the built-in types. Idempotent, so a second game on the page does
 * not duplicate the palette.
 */
export function registerBuiltInEntityTypes(): () => void {
	if (registered) return registered;
	registered = registerEntityTypes(BUILT_IN_ENTITY_TYPES);
	return registered;
}
