import { describe, expect, it } from 'vitest';
import {
	clampThickness,
	computeDockLayout,
	createEmptyDockRegistry,
	dockSlotIndex,
	findDockedSide,
	innerEdgeFor,
	insertIntoZone,
	MIN_FREE_SPACE,
	normalizeDockRegistry,
	previewDockRect,
	removeFromZones,
	resolveThickness,
	type DockRegistry,
	type Viewport,
} from '../../src/components/common/dock-layout';

const viewport: Viewport = { width: 1000, height: 800 };

const registryOf = (
	entries: Array<[side: 'left' | 'right' | 'top' | 'bottom', panels: string[], thickness?: number]>,
): DockRegistry => {
	let registry = createEmptyDockRegistry();
	for (const [side, panels, thickness] of entries) {
		for (const panelId of panels) {
			registry = insertIntoZone(registry, panelId, side);
		}
		if (thickness !== undefined) {
			registry[side].thickness = thickness;
		}
	}
	return registry;
};

describe('zone membership', () => {
	it('reports the side a panel is docked to', () => {
		const registry = registryOf([['bottom', ['console']]]);
		expect(findDockedSide(registry, 'console')).toBe('bottom');
		expect(findDockedSide(registry, 'main')).toBeNull();
	});

	it('moves a panel between zones rather than duplicating it', () => {
		const registry = insertIntoZone(registryOf([['left', ['main']]]), 'main', 'top');
		expect(registry.left.panels).toEqual([]);
		expect(registry.top.panels).toEqual(['main']);
	});

	it('inserts at a slot index and appends by default', () => {
		const registry = registryOf([['bottom', ['a', 'b']]]);
		expect(insertIntoZone(registry, 'c', 'bottom', 1).bottom.panels).toEqual(['a', 'c', 'b']);
		expect(insertIntoZone(registry, 'c', 'bottom').bottom.panels).toEqual(['a', 'b', 'c']);
	});

	it('removes a panel from every zone', () => {
		const registry = removeFromZones(registryOf([['right', ['main']]]), 'main');
		expect(findDockedSide(registry, 'main')).toBeNull();
	});
});

describe('thickness', () => {
	it('falls back to a viewport quarter until the user sizes a zone', () => {
		const registry = registryOf([['left', ['main']], ['bottom', ['console']]]);
		expect(resolveThickness(registry, 'left', viewport)).toBe(250);
		expect(resolveThickness(registry, 'bottom', viewport)).toBe(200);
	});

	it('is zero for an empty zone, so it insets nothing', () => {
		expect(resolveThickness(createEmptyDockRegistry(), 'left', viewport)).toBe(0);
	});

	it('honours an explicit thickness', () => {
		const registry = registryOf([['left', ['main'], 400]]);
		expect(resolveThickness(registry, 'left', viewport)).toBe(400);
	});

	it('floors a resize at the occupant minimum', () => {
		const registry = registryOf([['left', ['main']]]);
		expect(clampThickness(registry, 'left', 100, viewport, 300)).toBe(300);
	});

	it('leaves free space beside an opposing dock', () => {
		const registry = registryOf([['left', ['main']], ['right', ['console'], 250]]);
		expect(clampThickness(registry, 'left', 900, viewport, 300)).toBe(
			viewport.width - 250 - MIN_FREE_SPACE,
		);
	});
});

describe('computeDockLayout', () => {
	it('gives a left dock the full viewport height', () => {
		const layout = computeDockLayout(registryOf([['left', ['main']]]), viewport);
		expect(layout.main).toEqual({ x: 0, y: 0, width: 250, height: 800 });
	});

	it('pins a right dock to the right edge', () => {
		const layout = computeDockLayout(registryOf([['right', ['main'], 300]]), viewport);
		expect(layout.main).toEqual({ x: 700, y: 0, width: 300, height: 800 });
	});

	it('spans the full width when no side zone is occupied', () => {
		const layout = computeDockLayout(registryOf([['bottom', ['console']]]), viewport);
		expect(layout.console).toEqual({ x: 0, y: 600, width: 1000, height: 200 });
	});

	it('insets a bottom dock to the right of a left dock', () => {
		const registry = registryOf([['left', ['main']], ['bottom', ['console']]]);
		const layout = computeDockLayout(registry, viewport);
		expect(layout.main).toEqual({ x: 0, y: 0, width: 250, height: 800 });
		// Starts where the left dock ends rather than running under it.
		expect(layout.console).toEqual({ x: 250, y: 600, width: 750, height: 200 });
	});

	it('insets a top dock between both side zones', () => {
		const registry = registryOf([
			['left', ['main'], 200],
			['right', ['entities'], 100],
			['top', ['console'], 150],
		]);
		const layout = computeDockLayout(registry, viewport);
		expect(layout.console).toEqual({ x: 200, y: 0, width: 700, height: 150 });
	});

	it('splits a side zone evenly down its height', () => {
		const registry = registryOf([['left', ['main', 'console'], 200]]);
		const layout = computeDockLayout(registry, viewport);
		expect(layout.main).toEqual({ x: 0, y: 0, width: 200, height: 400 });
		expect(layout.console).toEqual({ x: 0, y: 400, width: 200, height: 400 });
	});

	it('splits a bottom zone evenly across the inset width', () => {
		const registry = registryOf([
			['left', ['main'], 250],
			['bottom', ['console', 'entities'], 200],
		]);
		const layout = computeDockLayout(registry, viewport);
		expect(layout.console).toEqual({ x: 250, y: 600, width: 375, height: 200 });
		expect(layout.entities).toEqual({ x: 625, y: 600, width: 375, height: 200 });
	});

	it('clamps a crowded zone to the minimum slot rather than vanishing', () => {
		const registry = registryOf([['bottom', ['a', 'b', 'c', 'd', 'e'], 200]]);
		const layout = computeDockLayout(registry, viewport, { minSlotExtent: 250 });
		// 1000 / 5 = 200, below the 250 minimum, so slots overflow instead.
		expect(layout.a?.width).toBe(250);
		expect(layout.e?.x).toBe(1000);
	});

	it('omits panels that are not docked', () => {
		const layout = computeDockLayout(createEmptyDockRegistry(), viewport);
		expect(layout).toEqual({});
	});
});

describe('dockSlotIndex', () => {
	const registry = registryOf([
		['left', ['main'], 250],
		['bottom', ['console', 'entities'], 200],
	]);

	it('returns 0 for an empty zone', () => {
		expect(dockSlotIndex(createEmptyDockRegistry(), 'bottom', { x: 500, y: 700 }, viewport)).toBe(0);
	});

	it('picks a slot from the pointer position along the zone', () => {
		// Slots span 250-625 (mid 437.5) and 625-1000 (mid 812.5).
		expect(dockSlotIndex(registry, 'bottom', { x: 300, y: 700 }, viewport)).toBe(0);
		expect(dockSlotIndex(registry, 'bottom', { x: 500, y: 700 }, viewport)).toBe(1);
		expect(dockSlotIndex(registry, 'bottom', { x: 900, y: 700 }, viewport)).toBe(2);
	});

	it('ignores the dragged panel own slot', () => {
		// Without `console`, `entities` alone fills 250-1000 (mid 625).
		expect(dockSlotIndex(registry, 'bottom', { x: 400, y: 700 }, viewport, 'console')).toBe(0);
		expect(dockSlotIndex(registry, 'bottom', { x: 700, y: 700 }, viewport, 'console')).toBe(1);
	});

	it('measures a side zone vertically', () => {
		const sideRegistry = registryOf([['left', ['main', 'console'], 250]]);
		expect(dockSlotIndex(sideRegistry, 'left', { x: 100, y: 100 }, viewport)).toBe(0);
		expect(dockSlotIndex(sideRegistry, 'left', { x: 100, y: 700 }, viewport)).toBe(2);
	});
});

describe('previewDockRect', () => {
	it('shows the slot a drop would produce, not the whole zone', () => {
		const registry = registryOf([['bottom', ['console'], 200]]);
		expect(previewDockRect(registry, 'main', 'bottom', 1, viewport)).toEqual({
			x: 500,
			y: 600,
			width: 500,
			height: 200,
		});
	});

	it('does not mutate the registry it previews', () => {
		const registry = registryOf([['bottom', ['console'], 200]]);
		previewDockRect(registry, 'main', 'left', 0, viewport);
		expect(findDockedSide(registry, 'main')).toBeNull();
	});
});

describe('innerEdgeFor', () => {
	it('maps each side to the edge it exposes to the viewport', () => {
		expect(innerEdgeFor('left')).toBe('e');
		expect(innerEdgeFor('right')).toBe('w');
		expect(innerEdgeFor('top')).toBe('s');
		expect(innerEdgeFor('bottom')).toBe('n');
	});
});

describe('normalizeDockRegistry', () => {
	it('returns empty zones for junk input', () => {
		expect(normalizeDockRegistry(undefined)).toEqual(createEmptyDockRegistry());
		expect(normalizeDockRegistry('nonsense')).toEqual(createEmptyDockRegistry());
	});

	it('keeps a panel in only the first zone that claims it', () => {
		const registry = normalizeDockRegistry({
			left: { panels: ['main'], thickness: 300 },
			bottom: { panels: ['main', 'console'], thickness: 0 },
		});
		expect(registry.left.panels).toEqual(['main']);
		expect(registry.bottom.panels).toEqual(['console']);
		expect(registry.left.thickness).toBe(300);
	});

	it('drops non-string ids and invalid thicknesses', () => {
		const registry = normalizeDockRegistry({
			top: { panels: ['console', 42, null, ''], thickness: Number.NaN },
		});
		expect(registry.top.panels).toEqual(['console']);
		expect(registry.top.thickness).toBe(0);
	});
});
