/**
 * Keeps the gizmo modes from outliving the selection they act on.
 *
 * The Move/Rotate/Scale buttons are only shown while something is selected, so
 * a tool left active after the selection clears would be unreachable: no button
 * to toggle it off, and the game keeps the simulation paused for the whole time
 * a transform tool is held (see `StageTransformTool.setMode`). Escape already
 * offers a manual way out via `disarmTools`; this is the automatic one.
 */

import { subscribe } from 'valtio/vanilla';

import { debugState, setDebugTool, type DebugTools } from '../entities/entities-state';
import { sendTool } from '../../bridge/editor-bridge';

const TRANSFORM_TOOLS = new Set<DebugTools>(['translate', 'rotate', 'scale']);

/** Whether a tool acts on the current selection. */
export function isTransformTool(tool: DebugTools): boolean {
	return TRANSFORM_TOOLS.has(tool);
}

/**
 * Drop an active transform tool when nothing is selected.
 *
 * @returns `true` when a tool was reset.
 */
export function releaseOrphanedTransformTool(): boolean {
	if (debugState.selectedEntityIds.length > 0) return false;
	if (!isTransformTool(debugState.tool)) return false;

	setDebugTool('none');
	sendTool('none');
	return true;
}

export interface TransformToolGuardOptions {
	/** @default true */
	enabled?: boolean;
}

/**
 * Watch the selection and release orphaned transform tools.
 *
 * @returns An uninstall function.
 */
export function installTransformToolGuard(
	options: TransformToolGuardOptions = {},
): () => void {
	if (options.enabled === false) return () => {};

	releaseOrphanedTransformTool();
	return subscribe(debugState, () => {
		releaseOrphanedTransformTool();
	});
}
