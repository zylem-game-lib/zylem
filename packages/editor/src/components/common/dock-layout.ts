/**
 * Dock layout geometry.
 *
 * Docking used to be per-panel: each panel snapped itself to a viewport edge
 * and sized itself from `window.innerWidth`. That cannot express two panels
 * sharing a side, or a bottom strip that stops at a left-docked panel, so the
 * dock state lives in one registry (persisted in the editor store) and every
 * panel's rect comes from `computeDockLayout`.
 *
 * This module is deliberately free of Solid and `window` so the geometry can
 * be unit tested directly.
 */

export type DockSide = 'left' | 'right' | 'top' | 'bottom';

/** `'main'` is the editor panel; any other id is a detached section id. */
export type DockPanelId = string;

export interface DockZoneState {
	/** Occupants in slot order along the zone's long axis. */
	panels: DockPanelId[];
	/**
	 * Width for left/right, height for top/bottom.
	 * `0` means "not chosen yet"; the layout falls back to a viewport quarter.
	 */
	thickness: number;
}

export type DockRegistry = Record<DockSide, DockZoneState>;

export interface Viewport {
	width: number;
	height: number;
}

export interface DockRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export const DOCK_SIDES: readonly DockSide[] = ['left', 'right', 'top', 'bottom'];

/** Keeps at least a sliver of the game visible between opposing docks. */
export const MIN_FREE_SPACE = 80;

/** Left and right zones are sized along x; top and bottom along y. */
export const isHorizontalSide = (side: DockSide): boolean =>
	side === 'left' || side === 'right';

/**
 * The edge a docked panel exposes to the rest of the viewport. Dragging it
 * resizes the zone instead of undocking the panel.
 */
export const innerEdgeFor = (side: DockSide): 'e' | 'w' | 's' | 'n' => {
	switch (side) {
		case 'left':
			return 'e';
		case 'right':
			return 'w';
		case 'top':
			return 's';
		default:
			return 'n';
	}
};

export const createEmptyDockRegistry = (): DockRegistry => ({
	left: { panels: [], thickness: 0 },
	right: { panels: [], thickness: 0 },
	top: { panels: [], thickness: 0 },
	bottom: { panels: [], thickness: 0 },
});

/** Repairs partial or malformed registries coming out of localStorage. */
export const normalizeDockRegistry = (value: unknown): DockRegistry => {
	const registry = createEmptyDockRegistry();
	if (!value || typeof value !== 'object') return registry;

	const seen = new Set<DockPanelId>();
	for (const side of DOCK_SIDES) {
		const zone = (value as Record<string, unknown>)[side];
		if (!zone || typeof zone !== 'object') continue;

		const panels = (zone as { panels?: unknown }).panels;
		if (Array.isArray(panels)) {
			for (const id of panels) {
				// A panel can only occupy one slot; drop duplicates rather than
				// rendering the same panel in two zones.
				if (typeof id !== 'string' || id.length === 0 || seen.has(id)) continue;
				seen.add(id);
				registry[side].panels.push(id);
			}
		}

		const thickness = (zone as { thickness?: unknown }).thickness;
		if (typeof thickness === 'number' && Number.isFinite(thickness) && thickness > 0) {
			registry[side].thickness = thickness;
		}
	}

	return registry;
};

export const findDockedSide = (
	registry: DockRegistry,
	panelId: DockPanelId,
): DockSide | null =>
	DOCK_SIDES.find((side) => registry[side].panels.includes(panelId)) ?? null;

export const isDocked = (registry: DockRegistry, panelId: DockPanelId): boolean =>
	findDockedSide(registry, panelId) !== null;

const cloneRegistry = (registry: DockRegistry): DockRegistry => {
	const next = createEmptyDockRegistry();
	for (const side of DOCK_SIDES) {
		next[side] = {
			panels: [...registry[side].panels],
			thickness: registry[side].thickness,
		};
	}
	return next;
};

export const removeFromZones = (
	registry: DockRegistry,
	panelId: DockPanelId,
): DockRegistry => {
	const next = cloneRegistry(registry);
	for (const side of DOCK_SIDES) {
		next[side].panels = next[side].panels.filter((id) => id !== panelId);
	}
	return next;
};

/**
 * Move `panelId` into `side` at `index`, removing it from wherever it was.
 * Omitting `index` appends.
 */
export const insertIntoZone = (
	registry: DockRegistry,
	panelId: DockPanelId,
	side: DockSide,
	index?: number,
): DockRegistry => {
	const next = removeFromZones(registry, panelId);
	const panels = next[side].panels;
	const target = index === undefined ? panels.length : Math.max(0, Math.min(index, panels.length));
	panels.splice(target, 0, panelId);
	return next;
};

const zoneViewportExtent = (side: DockSide, viewport: Viewport): number =>
	isHorizontalSide(side) ? viewport.width : viewport.height;

/**
 * Resolved thickness for a zone: the stored value, or a quarter of the
 * viewport when the user has never sized it.
 */
export const resolveThickness = (
	registry: DockRegistry,
	side: DockSide,
	viewport: Viewport,
): number => {
	if (registry[side].panels.length === 0) return 0;
	const extent = zoneViewportExtent(side, viewport);
	const stored = registry[side].thickness;
	const thickness = stored > 0 ? stored : Math.round(extent / 4);
	return Math.max(1, Math.min(thickness, extent));
};

/**
 * Clamp a proposed zone thickness so the panel stays usable and the opposing
 * zone keeps room. `minThickness` is the largest minimum among the occupants.
 */
export const clampThickness = (
	registry: DockRegistry,
	side: DockSide,
	thickness: number,
	viewport: Viewport,
	minThickness: number,
): number => {
	const extent = zoneViewportExtent(side, viewport);
	const opposite = side === 'left' ? 'right' : side === 'right' ? 'left' : side === 'top' ? 'bottom' : 'top';
	const opposingThickness = resolveThickness(registry, opposite, viewport);
	const max = Math.max(1, extent - opposingThickness - MIN_FREE_SPACE);
	const min = Math.max(1, Math.min(minThickness, max));
	return Math.round(Math.max(min, Math.min(thickness, max)));
};

/**
 * Slice a zone's long axis into `count` even slots, honouring `minSlot`.
 * A crowded zone overflows rather than shrinking slots to nothing.
 */
const slotExtents = (total: number, count: number, minSlot: number): number[] => {
	if (count <= 0) return [];
	const even = total / count;
	const extent = Math.max(minSlot, even);
	return Array.from({ length: count }, () => extent);
};

export interface DockLayoutOptions {
	/** Smallest slot extent along a zone's long axis. */
	minSlotExtent?: number;
}

/**
 * Rect for every docked panel.
 *
 * Left and right zones take the full viewport height and win over top and
 * bottom, which inset horizontally to the space between them. Panels sharing a
 * zone split its long axis evenly.
 */
export const computeDockLayout = (
	registry: DockRegistry,
	viewport: Viewport,
	options: DockLayoutOptions = {},
): Record<DockPanelId, DockRect> => {
	const minSlot = options.minSlotExtent ?? 0;
	const layout: Record<DockPanelId, DockRect> = {};

	const leftThickness = resolveThickness(registry, 'left', viewport);
	const rightThickness = resolveThickness(registry, 'right', viewport);
	const topThickness = resolveThickness(registry, 'top', viewport);
	const bottomThickness = resolveThickness(registry, 'bottom', viewport);

	// Side zones own the full height.
	for (const side of ['left', 'right'] as const) {
		const panels = registry[side].panels;
		if (panels.length === 0) continue;
		const width = side === 'left' ? leftThickness : rightThickness;
		const x = side === 'left' ? 0 : Math.max(0, viewport.width - width);
		const extents = slotExtents(viewport.height, panels.length, minSlot);
		let y = 0;
		panels.forEach((panelId, index) => {
			layout[panelId] = { x, y, width, height: extents[index]! };
			y += extents[index]!;
		});
	}

	// Top and bottom fill only what the side zones leave behind.
	const insetX = leftThickness;
	const insetWidth = Math.max(1, viewport.width - leftThickness - rightThickness);
	for (const side of ['top', 'bottom'] as const) {
		const panels = registry[side].panels;
		if (panels.length === 0) continue;
		const height = side === 'top' ? topThickness : bottomThickness;
		const y = side === 'top' ? 0 : Math.max(0, viewport.height - height);
		const extents = slotExtents(insetWidth, panels.length, minSlot);
		let x = insetX;
		panels.forEach((panelId, index) => {
			layout[panelId] = { x, y, width: extents[index]!, height };
			x += extents[index]!;
		});
	}

	return layout;
};

/**
 * Where a panel would land if dropped on `side`, from the pointer's position
 * along the zone's long axis compared against the existing slot midpoints.
 * Mirrors the accordion's drop-index behaviour.
 */
export const dockSlotIndex = (
	registry: DockRegistry,
	side: DockSide,
	pointer: { x: number; y: number },
	viewport: Viewport,
	panelId?: DockPanelId,
): number => {
	// Ignore the dragged panel's own slot so hovering its current spot is a no-op.
	const withoutPanel = panelId ? removeFromZones(registry, panelId) : registry;
	const occupants = withoutPanel[side].panels;
	if (occupants.length === 0) return 0;

	const layout = computeDockLayout(withoutPanel, viewport);
	const alongY = isHorizontalSide(side);
	let index = 0;
	occupants.forEach((occupantId, slot) => {
		const rect = layout[occupantId];
		if (!rect) return;
		const middle = alongY ? rect.y + rect.height / 2 : rect.x + rect.width / 2;
		const position = alongY ? pointer.y : pointer.x;
		if (position > middle) index = slot + 1;
	});
	return index;
};

/** Rect a panel would occupy if docked to `side` at `index`, for the drag preview. */
export const previewDockRect = (
	registry: DockRegistry,
	panelId: DockPanelId,
	side: DockSide,
	index: number,
	viewport: Viewport,
	options?: DockLayoutOptions,
): DockRect | null => {
	const next = insertIntoZone(registry, panelId, side, index);
	return computeDockLayout(next, viewport, options)[panelId] ?? null;
};
