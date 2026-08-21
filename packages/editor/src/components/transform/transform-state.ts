/**
 * Snap settings and grid visibility for the transform tools.
 *
 * Owned by the editor because it is the UI for them, and mirrored to the game
 * over `snap:set` — the gizmo does the actual snapping, since only it knows the
 * drag target.
 */

import { proxy, subscribe } from 'valtio/vanilla';
import type { SnapSettingsPayload } from '@zylem/bridge';

import { sendGridVisible, sendSnapSettings } from '../../bridge/editor-bridge';
import { mirrorProxy } from '../common/proxy-mirror';

/** 15 degrees, the default rotation increment. */
export const DEFAULT_ROTATE_SNAP = Math.PI / 12;

export interface TransformState extends SnapSettingsPayload {
	/** Whether the game draws its construction-plane grid. */
	gridVisible: boolean;
}

export const transformState = proxy<TransformState>({
	enabled: true,
	translate: 0.25,
	rotate: DEFAULT_ROTATE_SNAP,
	scale: 0.1,
	gridVisible: false,
});

/** Solid-reactive view of {@link transformState}, for components. */
export const transformStore = mirrorProxy(transformState);

function snapPayload(): SnapSettingsPayload {
	return {
		enabled: transformState.enabled,
		translate: transformState.translate,
		rotate: transformState.rotate,
		scale: transformState.scale,
	};
}

export function setSnapEnabled(enabled: boolean): void {
	transformState.enabled = enabled;
}

export function setSnapIncrements(
	increments: Partial<Pick<TransformState, 'translate' | 'rotate' | 'scale'>>,
): void {
	// A zero or negative increment would snap every value onto 0.
	for (const [key, value] of Object.entries(increments)) {
		if (typeof value === 'number' && value > 0) {
			(transformState as any)[key] = value;
		}
	}
}

export function setGridVisible(visible: boolean): void {
	transformState.gridVisible = visible;
}

let installed = false;

/**
 * Mirror snap and grid changes to the game, and push the current values once so
 * a game that started with different defaults is brought into line.
 *
 * @returns An unsubscribe function.
 */
export function connectTransformState(): () => void {
	if (installed) return () => {};
	installed = true;

	sendSnapSettings(snapPayload());
	sendGridVisible(transformState.gridVisible);

	let lastGridVisible = transformState.gridVisible;
	const unsubscribe = subscribe(transformState, () => {
		sendSnapSettings(snapPayload());
		if (transformState.gridVisible !== lastGridVisible) {
			lastGridVisible = transformState.gridVisible;
			sendGridVisible(lastGridVisible);
		}
	});

	return () => {
		installed = false;
		unsubscribe();
	};
}
