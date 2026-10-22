/** A deliberately slow explanatory clock, not Zylem runtime instrumentation. */
export const STATIONS = [
	{ title: 'Read input', layer: 'game-lib', call: 'params() · customUpdate()', detail: 'Poll input, clamp delta and run the game callback before entering the active stage.' },
	{ title: 'Write behavior input', layer: 'game-lib → behaviors', call: 'behaviorSystems.update()', detail: 'Stage-scoped systems write this update’s inputs. Their handles may read snapshots from the previous simulation step.' },
	{ title: 'Apply entity intent', layer: 'game-lib', call: 'nodeUpdate() · applyTransformChanges()', detail: 'Update each entity, apply its pending transforms, then remove entities marked for removal.' },
	{ title: 'Step the simulation', layer: 'behaviors → runtime', call: 'world.update() · postUpdate()', detail: 'Advance the WASM simulation and dispatch collisions. Then run behavior post-update hooks before reading render poses.' },
	{ title: 'Sync the scene', layer: 'runtime → game-lib', call: 'syncRenderPoses() · renderStrategy.update()', detail: 'Copy interpolated poses onto visual objects and update managed instance matrices.' },
	{ title: 'Frame the scene', layer: 'game-lib', call: 'camera.update() · scene.update()', detail: 'Update cameras after poses, then update the scene. The independent renderer draws the latest completed scene.' },
] as const;

export const STATION_SECONDS = 1.6;
export const DRAW_SECONDS = 1.1;
export const STATION_X = [-140, -84, -28, 28, 84, 140];
export const RETURN_SECONDS = 1.8;

export interface MachineState {
	station: number;
	progress: number;
	returning: boolean;
	updates: number;
	draws: number;
	drawnRevision: number;
	drawProgress: number;
	pauseUpdates: boolean;
}

export function createState(): MachineState {
	return { station: 0, progress: 0, returning: false, updates: 0, draws: 0, drawnRevision: 0, drawProgress: 0, pauseUpdates: false };
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => { const t = clamp01(value); return t * t * (3 - 2 * t); };

export function updatesHeld(state: MachineState): boolean {
	return state.pauseUpdates && !state.returning && state.station === 0 && state.progress === 0;
}

/** Position and stroke share the same phase; a shoe never presses a moving carriage. */
export function pose(state: MachineState): { x: number; stroke: number; shutter: number } {
	const shutter = ease(Math.cos(Math.PI * state.drawProgress) ** 2) * 25;
	if (state.returning) {
		return { x: STATION_X[5] + (STATION_X[0] - STATION_X[5]) * ease(state.progress), stroke: 0, shutter };
	}
	const previous = STATION_X[Math.max(0, state.station - 1)];
	const x = previous + (STATION_X[state.station] - previous) * ease(state.progress / 0.4);
	const stroke = 20 * ease((state.progress - 0.45) / 0.2) * (1 - ease((state.progress - 0.75) / 0.2));
	return { x, stroke, shutter };
}

function finishStation(state: MachineState): void {
	state.progress = 0;
	if (state.returning) { state.returning = false; state.station = 0; }
	else if (state.station < STATIONS.length - 1) state.station++;
	else { state.updates++; state.returning = true; }
}

export function drawOnce(state: MachineState): void {
	state.draws++;
	state.drawnRevision = state.updates;
	state.drawProgress = 0;
}

/** Advance both clocks chronologically, so a draw never samples a future update. */
export function advance(state: MachineState, seconds: number): void {
	if (!Number.isFinite(seconds) || seconds <= 0) return;
	let remaining = Math.min(seconds, 60);
	while (remaining > 1e-10) {
		const duration = state.returning ? RETURN_SECONDS : STATION_SECONDS;
		const updateTime = updatesHeld(state) ? Infinity : (1 - state.progress) * duration;
		const drawTime = (1 - state.drawProgress) * DRAW_SECONDS;
		const slice = Math.min(remaining, updateTime, drawTime);
		if (!updatesHeld(state)) state.progress += slice / duration;
		state.drawProgress += slice / DRAW_SECONDS;
		remaining -= slice;
		if (state.progress >= 1 - 1e-10) finishStation(state);
		if (state.drawProgress >= 1 - 1e-10) drawOnce(state);
	}
}

/** Explicit inspection can step even while automatic updates are held. */
export function stepStation(state: MachineState): void {
	finishStation(state);
	if (!state.returning) state.progress = 0.65;
}
