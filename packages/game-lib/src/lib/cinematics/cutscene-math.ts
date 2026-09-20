import { CatmullRomCurve3, Vector3 } from 'three';
import type {
	CameraKeyframe,
	CameraShot,
	CameraTrack,
	CutsceneCamera,
	CutsceneDefinition,
	CutsceneEasing,
	CutsceneScene,
	DollyPath,
	Vec3Def,
} from './cutscene-definition';

/**
 * Pure evaluation of a cutscene at a point in time: which scene and shot are
 * active, where each camera is, and the blended pose the picture should
 * show. Nothing here touches Three.js cameras or the stage, so the same code
 * drives the runtime player, the editor's scrubbing, and the unit specs.
 */

export function easeValue(easing: CutsceneEasing, t: number): number {
	const x = Math.min(1, Math.max(0, t));
	switch (easing) {
		case 'easeIn':
			return x * x;
		case 'easeOut':
			return 1 - (1 - x) * (1 - x);
		case 'easeInOut':
			return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
		default:
			return x;
	}
}

export interface EvaluatedPose {
	position: Vec3Def;
	lookAt: Vec3Def;
	fov: number;
}

export function lerpVec3(a: Vec3Def, b: Vec3Def, t: number): Vec3Def {
	return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
}

export function lerpPose(a: EvaluatedPose, b: EvaluatedPose, t: number): EvaluatedPose {
	return {
		position: lerpVec3(a.position, b.position, t),
		lookAt: lerpVec3(a.lookAt, b.lookAt, t),
		fov: a.fov + (b.fov - a.fov) * t,
	};
}

/** The scene containing `time` (last one wins on shared boundaries; the final scene past the end). */
export function sceneAt(scenes: readonly CutsceneScene[], time: number): CutsceneScene | undefined {
	let found: CutsceneScene | undefined;
	for (const scene of scenes) {
		if (time >= scene.start && time < scene.end) found = scene;
	}
	return found ?? scenes[scenes.length - 1];
}

/** The shot covering `time` on one track, if any (last one wins on overlaps). */
export function shotAt(shots: readonly CameraShot[], time: number): CameraShot | undefined {
	let found: CameraShot | undefined;
	for (const shot of shots) {
		if (time >= shot.start && time < shot.end) found = shot;
	}
	return found;
}

/**
 * The active shot across every camera track. Tracks are prioritised in
 * order, so a shot on the first camera track overrides one on the second.
 */
export function activeShot(definition: CutsceneDefinition, time: number): CameraShot | undefined {
	for (const track of definition.tracks) {
		if (track.kind !== 'camera') continue;
		const shot = shotAt(track.items, time);
		if (shot) return shot;
	}
	return undefined;
}

/** The shot that ended most recently before `shot` began, on any camera track. */
export function previousShot(definition: CutsceneDefinition, shot: CameraShot): CameraShot | undefined {
	let best: CameraShot | undefined;
	for (const track of definition.tracks) {
		if (track.kind !== 'camera') continue;
		for (const candidate of track.items) {
			if (candidate.id === shot.id || candidate.end > shot.start + 1e-6) continue;
			if (!best || candidate.end > best.end) best = candidate;
		}
	}
	return best;
}

const curveCache = new WeakMap<DollyPath, { key: string; curve: CatmullRomCurve3 }>();

function dollyCurve(path: DollyPath): CatmullRomCurve3 {
	const key = JSON.stringify([path.points, path.closed, path.tension]);
	const cached = curveCache.get(path);
	if (cached && cached.key === key) return cached.curve;
	const curve = new CatmullRomCurve3(
		path.points.map((point) => new Vector3(point.x, point.y, point.z)),
		path.closed,
		path.tension === 0.5 ? 'centripetal' : 'catmullrom',
		path.tension,
	);
	curveCache.set(path, { key, curve });
	return curve;
}

/** Point along a dolly path at `u` in 0…1 (arc-length parameterised). */
export function dollyPointAt(path: DollyPath, u: number): Vec3Def {
	if (path.points.length < 2) {
		const only = path.points[0] ?? { x: 0, y: 0, z: 0 };
		return { ...only };
	}
	const point = dollyCurve(path).getPointAt(Math.min(1, Math.max(0, u)));
	return { x: point.x, y: point.y, z: point.z };
}

/** Evenly spaced samples of a dolly path, for drawing it. */
export function sampleDollyPath(path: DollyPath, segments = 32): Vec3Def[] {
	const samples: Vec3Def[] = [];
	for (let index = 0; index <= segments; index += 1) samples.push(dollyPointAt(path, index / segments));
	return samples;
}

/**
 * Interpolates one keyframe channel (`position`, `lookAt` or `fov`) at
 * `time`. Keyframes lacking the channel are skipped. The base value acts as
 * an implicit keyframe at `baseTime` (the shot start), so a single keyframe
 * eases the camera away from its base pose; after the last keyframe it holds.
 */
function evaluateChannel<T>(
	keyframes: readonly CameraKeyframe[],
	pick: (keyframe: CameraKeyframe) => T | undefined,
	base: T,
	baseTime: number,
	time: number,
	lerp: (a: T, b: T, t: number) => T,
): T {
	let previous: { value: T; time: number } = { value: base, time: baseTime };
	let fromBase = true;
	let next: { value: T; time: number; easing: CutsceneEasing } | undefined;
	for (const keyframe of keyframes) {
		const value = pick(keyframe);
		if (value === undefined) continue;
		if (keyframe.time <= time) {
			if (fromBase || keyframe.time >= previous.time) {
				previous = { value, time: keyframe.time };
				fromBase = false;
			}
		} else if (!next || keyframe.time < next.time) {
			next = { value, time: keyframe.time, easing: keyframe.easing };
		}
	}
	if (!next) return previous.value;
	const span = next.time - previous.time;
	const t = span <= 0 ? 1 : (time - previous.time) / span;
	return lerp(previous.value, next.value, easeValue(next.easing, t));
}

/** Positions of named entities the cameras may reference, by name. */
export type TargetLookup = (name: string) => Vec3Def | undefined;

/**
 * Where a camera is at `time` while `shot` is active: base pose, then dolly
 * progress or follow target, then keyframes on top.
 */
export function evaluateCameraPose(
	camera: CutsceneCamera,
	definition: Pick<CutsceneDefinition, 'dollies'>,
	shot: Pick<CameraShot, 'start' | 'end'>,
	time: number,
	lookup?: TargetLookup,
): EvaluatedPose {
	let position: Vec3Def = { ...camera.pose.position };
	let lookAt: Vec3Def = { ...camera.pose.lookAt };
	const targetPosition = camera.target ? lookup?.(camera.target) : undefined;

	if (camera.kind === 'dolly' && camera.dollyId) {
		const path = definition.dollies.find((candidate) => candidate.id === camera.dollyId);
		if (path) {
			const span = shot.end - shot.start;
			const progress = span <= 0 ? 1 : (time - shot.start) / span;
			position = dollyPointAt(path, easeValue(camera.dollyEasing, progress));
		}
		if (targetPosition) lookAt = targetPosition;
	} else if (camera.kind === 'follow' && targetPosition) {
		const offset = camera.offset ?? { x: 0, y: 3, z: 8 };
		position = { x: targetPosition.x + offset.x, y: targetPosition.y + offset.y, z: targetPosition.z + offset.z };
		lookAt = targetPosition;
	}

	const sorted = [...camera.keyframes].sort((a, b) => a.time - b.time);
	position = evaluateChannel(sorted, (keyframe) => keyframe.position, position, shot.start, time, lerpVec3);
	lookAt = evaluateChannel(sorted, (keyframe) => keyframe.lookAt, lookAt, shot.start, time, lerpVec3);
	const fov = evaluateChannel(
		sorted,
		(keyframe) => keyframe.fov,
		camera.fov,
		shot.start,
		time,
		(a, b, t) => a + (b - a) * t,
	);
	return { position, lookAt, fov };
}

export interface CutsceneFrame {
	scene: CutsceneScene | undefined;
	shot: CameraShot | undefined;
	camera: CutsceneCamera | undefined;
	pose: EvaluatedPose | undefined;
	/** 0…1 while blending in from the previous shot, else 1. */
	blend: number;
}

/**
 * Everything the picture needs at `time`: the active scene and shot, and the
 * camera pose after blending from the previous shot when the shot asks for
 * it. Without an active shot the pose is `undefined` and the gameplay camera
 * keeps control.
 */
export function evaluateCutscene(definition: CutsceneDefinition, time: number, lookup?: TargetLookup): CutsceneFrame {
	const scene = sceneAt(definition.scenes, time);
	const shot = activeShot(definition, time);
	if (!shot) return { scene, shot: undefined, camera: undefined, pose: undefined, blend: 1 };
	const camera = definition.cameras.find((candidate) => candidate.id === shot.cameraId);
	if (!camera) return { scene, shot, camera: undefined, pose: undefined, blend: 1 };
	let pose = evaluateCameraPose(camera, definition, shot, time, lookup);
	let blend = 1;
	if (shot.blend.duration > 0 && time < shot.start + shot.blend.duration) {
		const previous = previousShot(definition, shot);
		const previousCamera = previous
			? definition.cameras.find((candidate) => candidate.id === previous.cameraId)
			: undefined;
		if (previous && previousCamera) {
			// The outgoing camera holds its final frame while the blend runs.
			const outgoing = evaluateCameraPose(previousCamera, definition, previous, Math.min(time, previous.end), lookup);
			blend = easeValue(shot.blend.easing, (time - shot.start) / shot.blend.duration);
			pose = lerpPose(outgoing, pose, blend);
		}
	}
	return { scene, shot, camera, pose, blend };
}

/** Items on every event/audio track with `time` in `(from, to]`, in time order. */
export function itemsBetween<T extends { time: number }>(items: readonly T[], from: number, to: number): T[] {
	return items.filter((item) => item.time > from && item.time <= to).sort((a, b) => a.time - b.time);
}

/** Camera tracks in priority order. */
export function cameraTracks(definition: CutsceneDefinition): CameraTrack[] {
	return definition.tracks.filter((track): track is CameraTrack => track.kind === 'camera');
}

/** Total length: the declared duration, or the furthest scene end if longer. */
export function cutsceneLength(definition: Pick<CutsceneDefinition, 'duration' | 'scenes'>): number {
	return Math.max(definition.duration, ...definition.scenes.map((scene) => scene.end));
}
