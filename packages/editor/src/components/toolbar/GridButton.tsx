import Grid3x3 from 'lucide-solid/icons/grid-3x3';
import Magnet from 'lucide-solid/icons/magnet';
import type { Component } from 'solid-js';

import {
	setGridVisible,
	setSnapEnabled,
	transformStore,
} from '../transform/transform-state';
import { ToolbarButton } from '@zylem/ui/components';

/** Show or hide the game's construction-plane grid. */
export const GridButton: Component = () => (
	<ToolbarButton
		label={transformStore.gridVisible ? 'Hide grid' : 'Show grid'}
		selected={transformStore.gridVisible}
		onClick={() => setGridVisible(!transformStore.gridVisible)}
	>
		<Grid3x3 class="zylem-icon" />
	</ToolbarButton>
);

/**
 * Snap toggle. Alt does the same thing per-drag; this is for turning it off for
 * a whole stretch of work rather than a single move.
 */
export const SnapButton: Component = () => (
	<ToolbarButton
		label={transformStore.enabled ? 'Snapping on' : 'Snapping off'}
		selected={transformStore.enabled}
		onClick={() => setSnapEnabled(!transformStore.enabled)}
	>
		<Magnet class="zylem-icon" />
	</ToolbarButton>
);
