import { describe, expect, it } from 'vitest';

import type { CutsceneDefinition } from '../../../src/lib/cinematics/cutscene-definition';
import {
	activeShot,
	cutsceneLength,
	dollyPointAt,
	easeValue,
	evaluateCameraPose,
	evaluateCutscene,
	itemsBetween,
	previousShot,
	sceneAt,
	shotAt,
} from '../../../src/lib/cinematics/cutscene-math';
import { createCutscenePlayer, type CutsceneHost } from '../../../src/lib/cinematics/cutscene-player';

const cutscene: CutsceneDefinition = {
	id: 'intro',
	name: 'Intro',
	duration: 10,
	stage: null,
	skippable: true,
	scenes: [
		{ id: 's1', name: 'Arrival', start: 0, end: 4, transitionIn: { type: 'cut', duration: 0, easing: 'linear' } },
		{ id: 's2', name: 'Reveal', start: 4, end: 10, transitionIn: { type: 'fade', duration: 1, easing: 'easeInOut' } },
	],
	cameras: [
		{
			id: 'wide',
			name: 'Wide',
			kind: 'static',
			fov: 60,
			pose: { position: { x: 0, y: 5, z: 10 }, lookAt: { x: 0, y: 0, z: 0 } },
			dollyEasing: 'linear',
			damping: 0,
			keyframes: [
				{ id: 'k1', time: 2, position: { x: 0, y: 5, z: 6 }, easing: 'linear' },
				{ id: 'k2', time: 4, fov: 40, easing: 'linear' },
			],
		},
		{
			id: 'rail',
			name: 'Rail',
			kind: 'dolly',
			fov: 50,
			pose: { position: { x: 0, y: 0, z: 0 }, lookAt: { x: 0, y: 1, z: 0 } },
			dollyId: 'd1',
			dollyEasing: 'linear',
			target: 'hero',
			damping: 0,
			keyframes: [],
		},
		{
			id: 'chase',
			name: 'Chase',
			kind: 'follow',
			fov: 70,
			pose: { position: { x: 0, y: 0, z: 0 }, lookAt: { x: 0, y: 0, z: 0 } },
			dollyEasing: 'linear',
			target: 'hero',
			offset: { x: 0, y: 2, z: 5 },
			damping: 0.5,
			keyframes: [],
		},
	],
	dollies: [
		{
			id: 'd1',
			name: 'Rail',
			points: [
				{ x: -10, y: 2, z: 0 },
				{ x: 0, y: 2, z: 0 },
				{ x: 10, y: 2, z: 0 },
			],
			closed: false,
			tension: 0.5,
		},
	],
	tracks: [
		{
			kind: 'camera',
			id: 'cams',
			name: 'Cameras',
			items: [
				{ id: 'shot1', cameraId: 'wide', start: 0, end: 4, blend: { duration: 0, easing: 'linear' } },
				{ id: 'shot2', cameraId: 'rail', start: 4, end: 8, blend: { duration: 2, easing: 'linear' } },
				{ id: 'shot3', cameraId: 'chase', start: 8, end: 10, blend: { duration: 0, easing: 'linear' } },
			],
		},
		{
			kind: 'event',
			id: 'events',
			name: 'Events',
			items: [
				{ id: 'e1', time: 1, event: { type: 'emit', name: 'intro:start', payload: {} } },
				{ id: 'e2', time: 4, event: { type: 'setVariable', name: 'phase', value: 2 } },
				{ id: 'e3', time: 9.5, event: { type: 'playAnimation', entity: 'hero', key: 'wave' } },
			],
		},
	],
};

const hero = { x: 3, y: 0, z: -2 };
const lookup = (name: string) => (name === 'hero' ? hero : undefined);

describe('easing', () => {
	it('clamps and shapes the curve', () => {
		expect(easeValue('linear', 0.25)).toBe(0.25);
		expect(easeValue('easeIn', 0.5)).toBe(0.25);
		expect(easeValue('easeOut', 0.5)).toBe(0.75);
		expect(easeValue('easeInOut', 0.5)).toBe(0.5);
		expect(easeValue('linear', 2)).toBe(1);
		expect(easeValue('linear', -1)).toBe(0);
	});
});

describe('scene and shot lookup', () => {
	it('finds the scene containing a time and the last scene past the end', () => {
		expect(sceneAt(cutscene.scenes, 0)?.id).toBe('s1');
		expect(sceneAt(cutscene.scenes, 4)?.id).toBe('s2');
		expect(sceneAt(cutscene.scenes, 99)?.id).toBe('s2');
	});

	it('finds the active shot and its predecessor', () => {
		const track = cutscene.tracks[0]!;
		if (track.kind !== 'camera') throw new Error('expected camera track');
		expect(shotAt(track.items, 3.99)?.id).toBe('shot1');
		expect(shotAt(track.items, 4)?.id).toBe('shot2');
		expect(activeShot(cutscene, 8.5)?.id).toBe('shot3');
		expect(previousShot(cutscene, track.items[1]!)?.id).toBe('shot1');
		expect(previousShot(cutscene, track.items[0]!)).toBeUndefined();
	});

	it('measures the cutscene by the furthest of duration and scene ends', () => {
		expect(cutsceneLength(cutscene)).toBe(10);
		expect(cutsceneLength({ duration: 3, scenes: cutscene.scenes })).toBe(10);
	});
});

describe('evaluateCameraPose', () => {
	const shot = { start: 0, end: 4 };
	const wide = cutscene.cameras[0]!;

	it('eases from the base pose into the first keyframe and holds after the last', () => {
		expect(evaluateCameraPose(wide, cutscene, shot, 0).position).toEqual({ x: 0, y: 5, z: 10 });
		expect(evaluateCameraPose(wide, cutscene, shot, 1).position).toEqual({ x: 0, y: 5, z: 8 });
		expect(evaluateCameraPose(wide, cutscene, shot, 2).position).toEqual({ x: 0, y: 5, z: 6 });
		expect(evaluateCameraPose(wide, cutscene, shot, 3.5).position).toEqual({ x: 0, y: 5, z: 6 });
	});

	it('interpolates channels independently', () => {
		// fov keyframe at 4s only; position keyframe at 2s does not carry fov.
		expect(evaluateCameraPose(wide, cutscene, shot, 0).fov).toBe(60);
		expect(evaluateCameraPose(wide, cutscene, shot, 2).fov).toBe(50);
		expect(evaluateCameraPose(wide, cutscene, shot, 4).fov).toBe(40);
		expect(evaluateCameraPose(wide, cutscene, shot, 2).lookAt).toEqual({ x: 0, y: 0, z: 0 });
	});

	it('rides a dolly over the shot and looks at the target', () => {
		const rail = cutscene.cameras[1]!;
		const dollyShot = { start: 4, end: 8 };
		const start = evaluateCameraPose(rail, cutscene, dollyShot, 4, lookup);
		const middle = evaluateCameraPose(rail, cutscene, dollyShot, 6, lookup);
		const end = evaluateCameraPose(rail, cutscene, dollyShot, 8, lookup);
		expect(start.position.x).toBeCloseTo(-10);
		expect(middle.position.x).toBeCloseTo(0, 1);
		expect(end.position.x).toBeCloseTo(10);
		expect(middle.lookAt).toEqual(hero);
		expect(middle.fov).toBe(50);
	});

	it('follows a target with an offset', () => {
		const chase = cutscene.cameras[2]!;
		const pose = evaluateCameraPose(chase, cutscene, { start: 8, end: 10 }, 9, lookup);
		expect(pose.position).toEqual({ x: 3, y: 2, z: 3 });
		expect(pose.lookAt).toEqual(hero);
	});

	it('keeps the base pose when a follow target is missing', () => {
		const chase = cutscene.cameras[2]!;
		const pose = evaluateCameraPose(chase, cutscene, { start: 8, end: 10 }, 9);
		expect(pose.position).toEqual({ x: 0, y: 0, z: 0 });
	});
});

describe('dollyPointAt', () => {
	it('is arc-length parameterised along the spline', () => {
		const path = cutscene.dollies[0]!;
		expect(dollyPointAt(path, 0)).toEqual({ x: -10, y: 2, z: 0 });
		expect(dollyPointAt(path, 1).x).toBeCloseTo(10);
		expect(dollyPointAt(path, 0.5).x).toBeCloseTo(0, 1);
		expect(dollyPointAt(path, 0.25).x).toBeCloseTo(-5, 0);
	});
});

describe('evaluateCutscene', () => {
	it('blends from the outgoing shot, holding its final frame', () => {
		const before = evaluateCutscene(cutscene, 3.99, lookup);
		expect(before.camera?.id).toBe('wide');
		expect(before.blend).toBe(1);

		const start = evaluateCutscene(cutscene, 4, lookup);
		expect(start.shot?.id).toBe('shot2');
		expect(start.blend).toBe(0);
		// At blend start the picture still shows the wide camera's last frame.
		expect(start.pose?.position).toEqual({ x: 0, y: 5, z: 6 });
		expect(start.pose?.fov).toBe(40);

		const half = evaluateCutscene(cutscene, 5, lookup);
		expect(half.blend).toBe(0.5);
		expect(half.pose?.fov).toBe(45);

		const done = evaluateCutscene(cutscene, 6.5, lookup);
		expect(done.blend).toBe(1);
		expect(done.camera?.id).toBe('rail');
	});

	it('returns no pose when no shot covers the time', () => {
		const gap: CutsceneDefinition = {
			...cutscene,
			tracks: [{ kind: 'camera', id: 'c', name: 'c', items: [{ id: 'x', cameraId: 'wide', start: 2, end: 3, blend: { duration: 0, easing: 'linear' } }] }],
		};
		expect(evaluateCutscene(gap, 1).pose).toBeUndefined();
		expect(evaluateCutscene(gap, 2.5).pose).toBeDefined();
	});

	it('prefers the first camera track when shots overlap', () => {
		const layered: CutsceneDefinition = {
			...cutscene,
			tracks: [
				{ kind: 'camera', id: 'top', name: 'top', items: [{ id: 'a', cameraId: 'chase', start: 0, end: 10, blend: { duration: 0, easing: 'linear' } }] },
				...cutscene.tracks,
			],
		};
		expect(evaluateCutscene(layered, 2, lookup).camera?.id).toBe('chase');
	});
});

describe('itemsBetween', () => {
	it('selects items in (from, to] sorted by time', () => {
		const track = cutscene.tracks[1]!;
		if (track.kind !== 'event') throw new Error('expected event track');
		expect(itemsBetween(track.items, 0, 1).map((item) => item.id)).toEqual(['e1']);
		expect(itemsBetween(track.items, 1, 4).map((item) => item.id)).toEqual(['e2']);
		expect(itemsBetween(track.items, 0, 10).map((item) => item.id)).toEqual(['e1', 'e2', 'e3']);
		expect(itemsBetween(track.items, 4, 4)).toEqual([]);
	});
});

describe('createCutscenePlayer', () => {
	const makeHost = () => {
		const calls: string[] = [];
		const transitions: string[] = [];
		const host: CutsceneHost = {
			camera: () => null,
			entityPosition: lookup,
			dispatch: (name) => calls.push(`emit:${name}`),
			setVariable: (name, value) => calls.push(`set:${name}=${String(value)}`),
			playAnimation: (entity, key) => calls.push(`anim:${entity}:${key}`),
			beginTransition: (transition) => transitions.push(transition.type),
		};
		return { host, calls, transitions };
	};

	it('fires events exactly once as time advances, and transitions on scene changes', () => {
		const { host, calls, transitions } = makeHost();
		const player = createCutscenePlayer(cutscene, { host, tick: 'manual' });
		player.play();
		player.update(0.5);
		player.update(0.5); // t = 1 → e1
		player.update(2.9); // t = 3.9
		expect(calls).toEqual(['emit:intro:start']);
		player.update(0.2); // t = 4.1 → scene 2 (fade), e2
		expect(transitions).toEqual(['fade']);
		expect(calls).toEqual(['emit:intro:start', 'set:phase=2']);
		// 5% into the 2s blend from the wide camera (x = 0) toward the rail start (x ≈ -9.5).
		expect(player.pose?.position.x).toBeCloseTo(-0.475, 1);
		expect(player.state).toBe('playing');
	});

	it('completes at the end and reports state changes', () => {
		const { host } = makeHost();
		const states: string[] = [];
		let completed = 0;
		const player = createCutscenePlayer(cutscene, { host, tick: 'manual' });
		player.on('state', (state) => states.push(state));
		player.on('complete', () => (completed += 1));
		player.play(9);
		player.update(2);
		expect(player.time).toBe(10);
		expect(player.state).toBe('finished');
		expect(completed).toBe(1);
		expect(states).toEqual(['playing', 'finished']);
	});

	it('seeks without firing events and pauses an idle player', () => {
		const { host, calls, transitions } = makeHost();
		const player = createCutscenePlayer(cutscene, { host, tick: 'manual' });
		player.seek(9);
		expect(calls).toEqual([]);
		expect(transitions).toEqual([]);
		expect(player.state).toBe('paused');
		expect(player.pose?.position).toEqual({ x: 3, y: 2, z: 3 });
	});

	it('skips to the end when skippable and releases on stop', () => {
		const { host } = makeHost();
		const player = createCutscenePlayer(cutscene, { host, tick: 'manual' });
		player.play();
		expect(player.skip()).toBe(true);
		expect(player.state).toBe('finished');
		player.stop();
		expect(player.state).toBe('idle');
		expect(player.time).toBe(0);
		expect(player.pose).toBeUndefined();

		const locked = createCutscenePlayer({ ...cutscene, skippable: false }, { host, tick: 'manual' });
		locked.play();
		expect(locked.skip()).toBe(false);
		expect(locked.state).toBe('playing');
	});

	it('swaps definitions in place while keeping the playhead', () => {
		const { host } = makeHost();
		const player = createCutscenePlayer(cutscene, { host, tick: 'manual' });
		player.play(1);
		player.setDefinition({
			...cutscene,
			cameras: [{ ...cutscene.cameras[0]!, pose: { position: { x: 9, y: 9, z: 9 }, lookAt: { x: 0, y: 0, z: 0 } }, keyframes: [] }],
		});
		expect(player.time).toBe(1);
		expect(player.pose?.position).toEqual({ x: 9, y: 9, z: 9 });
	});
});
