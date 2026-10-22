import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { advance, createState, drawOnce, pose, stepStation, STATIONS, STATION_SECONDS, RETURN_SECONDS, updatesHeld } from './model.ts';
import { buildGeometry } from './geometry.mjs';
import { paintOrder, placeParts } from './spatial.ts';

test('updates traverse six stations and only commit after the final station', () => {
	const state = createState();
	for (let i = 0; i < STATIONS.length; i++) {
		assert.equal(state.station, i);
		assert.equal(state.updates, 0);
		advance(state, STATION_SECONDS);
	}
	assert.equal(state.updates, 1);
	assert.equal(state.returning, true);
	advance(state, RETURN_SECONDS);
	assert.equal(state.station, 0);
	assert.equal(state.returning, false);
});

test('renderer samples the last complete update and continues while updates are held', () => {
	const state = createState();
	advance(state, 1);
	state.pauseUpdates = true;
	advance(state, 15);
	assert.equal(state.updates, 1);
	assert.equal(updatesHeld(state), true);
	const previousDraws = state.draws;
	advance(state, 5);
	assert.ok(state.draws > previousDraws);
	assert.equal(state.updates, 1);
	assert.equal(state.drawnRevision, 1);
	state.pauseUpdates = false;
	advance(state, 12);
	assert.equal(state.updates, 2);
});

test('clock advancement is independent of frame subdivisions', () => {
	const whole = createState(), sliced = createState();
	advance(whole, 23);
	for (let i = 0; i < 2300; i++) advance(sliced, 0.01);
	for (const key of Object.keys(whole)) {
		if (typeof whole[key] === 'number') assert.ok(Math.abs(whole[key] - sliced[key]) < 1e-8, key);
		else assert.equal(whole[key], sliced[key], key);
	}
});

test('a draw before the first completed update cannot sample the future', () => {
	const state = createState();
	advance(state, 9.6);
	assert.equal(state.updates, 1);
	assert.equal(state.drawnRevision, 0);
	drawOnce(state);
	assert.equal(state.drawnRevision, 1);
});

test('manual stepping works with reduced-motion style stopped clocks', () => {
	const state = createState();
	state.pauseUpdates = true;
	for (let i = 0; i < STATIONS.length; i++) stepStation(state);
	assert.equal(state.updates, 1);
	assert.equal(state.draws, 0);
	drawOnce(state);
	assert.equal(state.drawnRevision, 1);
	for (const dt of [NaN, Infinity, -1, 0]) advance(state, dt);
	assert.equal(state.draws, 1);
});

test('press transport, return and inspection shutter stay clear through a complete cycle', () => {
	const { parts } = buildGeometry();
	assert.ok(parts.length >= 40 && parts.length <= 80);
	const state = createState();
	let previousX = pose(state).x;
	for (let frame = 0; frame < 720; frame++) {
		const { x, stroke, shutter } = pose(state);
		if (stroke > 0.001) assert.ok(Math.abs(previousX - x) < 0.001, 'shoe must retract before transport');
		const placed = placeParts(parts, x, state.returning ? -1 : state.station, stroke, shutter);
		assert.equal(new Set(paintOrder(placed)).size, parts.length);
		for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) {
			const a = placed[i], b = placed[j];
			const overlaps = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 1e-7 &&
				Math.min(a.y + a.d, b.y + b.d) - Math.max(a.y, b.y) > 1e-7 &&
				Math.min(a.z + a.h, b.z + b.h) - Math.max(a.z, b.z) > 1e-7;
			assert.equal(overlaps, false, `${a.id} intersects ${b.id} at frame ${frame}`);
		}
		previousX = x;
		advance(state, 1 / 60);
	}
});

test('the explained stage sequence still matches the engine source', () => {
	const source = readFileSync(new URL('../../../packages/game-lib/src/lib/stage/zylem-stage.ts', import.meta.url), 'utf8');
	const update = source.slice(source.indexOf('protected _update('), source.indexOf('public outOfLoop('));
	const sections = [...update.matchAll(/profileStageFrameSection\('([^']+)'/g)].map(match => match[1]);
	assert.deepEqual(sections, ['behaviorSystems', 'entityLoop', 'worldUpdate', 'behaviorPostUpdate', 'syncRenderPoses', 'renderStrategy', 'camera', 'scene']);
});
