import {
	OrthographicCamera,
	PerspectiveCamera,
	Raycaster,
	Scene,
	Vector2,
	Vector3,
	type Camera,
} from 'three';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	boxBrush,
	brushBounds,
	frameForPlane,
	primitiveBrushes,
	type BrushVec3,
	type LevelDocument,
	type LevelDrawShape,
	type LevelGesture,
	type LevelSelectPayload,
	type LevelSyncPayload,
} from '@zylem/bridge';
import {
	DEFAULT_SNAP_SETTINGS,
	debugState,
	setSnapSettings,
	type DebugTools,
} from '../../../src/lib/debug/debug-state';
import type { GizmoRay } from '../../../src/lib/debug/transform-gizmo';
import { LevelSession, type LevelSessionHost } from '../../../src/lib/level/level-session';

const VIEWPORT = { width: 800, height: 600 };
const BOX_SHAPE: LevelDrawShape = { shape: 'box', turn: 0, sides: 12, segments: 8, thickness: 1 };
const TOP_FACE = { brushId: 'box', kind: 'face' as const, planes: [2] };

/** The editor's Top view: orthographic, looking down, -Z up the screen. 50 px per unit. */
function topCamera(): OrthographicCamera {
	const camera = new OrthographicCamera(-8, 8, 6, -6, 0.1, 500);
	camera.position.set(0, 100, 0);
	camera.up.set(0, 0, -1);
	camera.lookAt(0, 0, 0);
	camera.updateProjectionMatrix();
	camera.updateMatrixWorld(true);
	return camera;
}

/** The editor's Side view: orthographic, looking along -X, Y up the screen. */
function sideCamera(): OrthographicCamera {
	const camera = new OrthographicCamera(-8, 8, 6, -6, 0.1, 500);
	camera.position.set(100, 0, 0);
	camera.lookAt(0, 0, 0);
	camera.updateProjectionMatrix();
	camera.updateMatrixWorld(true);
	return camera;
}

/** The editor's isometric view, looking along -(1, 1, 1). */
function isoCamera(): OrthographicCamera {
	const camera = new OrthographicCamera(-8, 8, 6, -6, -500, 500);
	camera.position.set(50, 50, 50);
	camera.lookAt(0, 0, 0);
	camera.updateProjectionMatrix();
	camera.updateMatrixWorld(true);
	return camera;
}

function perspectiveCamera(position: Vector3, target: Vector3): PerspectiveCamera {
	const camera = new PerspectiveCamera(50, VIEWPORT.width / VIEWPORT.height, 0.1, 500);
	camera.position.copy(position);
	camera.lookAt(target);
	camera.updateProjectionMatrix();
	camera.updateMatrixWorld(true);
	return camera;
}

/** A unit-tall box on the ground, two units square. Planes: +X, -X, +Y, -Y, +Z, -Z. */
function levelDocument(): LevelDocument {
	return {
		version: 2,
		solids: [{ id: 'box', planes: boxBrush({ x: -1, y: 0, z: -1 }, { x: 1, y: 1, z: 1 }) }],
		doodads: [],
		entities: [],
	};
}

function payload(overrides: Partial<LevelSyncPayload> = {}): LevelSyncPayload {
	return {
		document: levelDocument(),
		hiddenLayers: [],
		selectedIds: [],
		activeLayer: 'solid',
		placement: null,
		drawShape: BOX_SHAPE,
		...overrides,
	};
}

const sessions: LevelSession[] = [];

function rig(options: { camera?: Camera; cameraId?: string } = {}) {
	const scene = new Scene();
	const camera = options.camera ?? topCamera();
	const gestures: LevelGesture[] = [];
	const selects: LevelSelectPayload[] = [];
	const notices: string[] = [];
	const host: LevelSessionHost = {
		getScene: () => scene,
		cameraId: () => options.cameraId ?? 'editor:top',
		viewDirection: () => {
			const direction = new Vector3();
			camera.getWorldDirection(direction);
			return { x: direction.x, y: direction.y, z: direction.z };
		},
		camera: () => camera,
		viewport: () => VIEWPORT,
		physicsHit: () => null,
		spawnZone: async () => null,
		detach: () => {},
		spawnHulls: () => null,
		despawnHulls: () => {},
		publishGesture: (gesture) => gestures.push(gesture),
		publishSelect: (select) => selects.push(select),
		publishNotice: (message) => notices.push(message),
	};
	const session = new LevelSession(host);
	sessions.push(session);
	const raycaster = new Raycaster();
	/** The pointer ray through a world point, as the delegate casts it from the camera. */
	const rayAt = (point: BrushVec3): GizmoRay => {
		const ndc = new Vector3(point.x, point.y, point.z).project(camera);
		raycaster.setFromCamera(new Vector2(ndc.x, ndc.y), camera);
		return { origin: raycaster.ray.origin.clone(), direction: raycaster.ray.direction.clone() };
	};
	/** Press, drag through `path`, and release on its last point. */
	const drag = (path: BrushVec3[], input: { shiftKey?: boolean; altKey?: boolean } = {}) => {
		session.pointerDown(rayAt(path[0]!), { ...input, timeStamp: 0 });
		for (const point of path.slice(1)) session.pointerMove(rayAt(point), input);
		session.pointerUp(rayAt(path[path.length - 1]!));
	};
	const click = (point: BrushVec3, input: { shiftKey?: boolean; timeStamp?: number } = {}) => {
		const handled = session.pointerDown(rayAt(point), input);
		session.pointerUp(rayAt(point));
		return handled;
	};
	return { scene, camera, session, gestures, selects, notices, rayAt, drag, click };
}

function arm(tool: DebugTools): void {
	debugState.tool = tool;
}

function expectPoint(actual: BrushVec3, expected: BrushVec3): void {
	expect(actual.x).toBeCloseTo(expected.x, 9);
	expect(actual.y).toBeCloseTo(expected.y, 9);
	expect(actual.z).toBeCloseTo(expected.z, 9);
}

function toolsGroup(scene: Scene) {
	const tools = scene.getObjectByName('level-tools');
	if (!tools) throw new Error('level tools are not mounted');
	return tools;
}

beforeEach(() => {
	setSnapSettings({ ...DEFAULT_SNAP_SETTINGS, translate: 1 });
});

afterEach(() => {
	for (const session of sessions.splice(0)) session.dispose();
	debugState.tool = 'none';
	setSnapSettings({ ...DEFAULT_SNAP_SETTINGS });
});

describe('level select clicks', () => {
	it('selects the object under the pointer, and clears on empty space', () => {
		const { session, selects, click } = rig();
		session.sync(payload());
		arm('select');

		expect(click({ x: 0.2, y: 1, z: 0.3 }, { timeStamp: 0 })).toBe(true);
		expect(click({ x: 5, y: 0, z: 5 }, { timeStamp: 1000 })).toBe(true);
		expect(selects).toEqual([{ id: 'box' }, { id: null }]);
	});

	it('names the face under the pointer by its plane index', () => {
		const { session, selects, click } = rig();
		session.sync(payload({ elementMode: 'face' }));
		arm('select');

		click({ x: 0.4, y: 1, z: -0.2 }, { timeStamp: 0 });
		expect(selects).toEqual([{ id: 'box', elements: [TOP_FACE] }]);
	});

	it('names a side face seen in perspective', () => {
		const camera = perspectiveCamera(new Vector3(6, 3, 2), new Vector3(0, 0.5, 0));
		const { session, selects, click } = rig({ camera, cameraId: 'editor:free' });
		session.sync(payload({ elementMode: 'face' }));
		arm('select');

		click({ x: 1, y: 0.5, z: 0.2 }, { timeStamp: 0 });
		expect(selects).toEqual([
			{ id: 'box', elements: [{ brushId: 'box', kind: 'face', planes: [0] }] },
		]);
	});

	it('picks the vertex in front when two share a pixel', () => {
		const { session, selects, click } = rig();
		session.sync(payload({ elementMode: 'vertex' }));
		arm('select');

		click({ x: 1.05, y: 1, z: 1.05 }, { timeStamp: 0 });
		expect(selects).toEqual([
			{ id: 'box', elements: [{ brushId: 'box', kind: 'vertex', planes: [0, 2, 4] }] },
		]);
	});

	it('picks the edge within a few pixels of the pointer', () => {
		const { session, selects, click } = rig();
		session.sync(payload({ elementMode: 'edge' }));
		arm('select');

		click({ x: 1.05, y: 1, z: 0 }, { timeStamp: 0 });
		click({ x: 1.5, y: 1, z: 0 }, { timeStamp: 1000 });
		expect(selects).toEqual([
			{ id: 'box', elements: [{ brushId: 'box', kind: 'edge', planes: [0, 2] }] },
			{ id: null },
		]);
	});

	it('adds to the selection with Shift', () => {
		const { session, selects, click } = rig();
		session.sync(payload({ selectedIds: ['box'] }));
		arm('select');

		click({ x: 0.2, y: 1, z: 0.3 }, { shiftKey: true, timeStamp: 0 });
		click({ x: 5, y: 0, z: 5 }, { shiftKey: true, timeStamp: 1000 });
		expect(selects).toEqual([
			{ id: 'box', additive: true },
			{ id: null, additive: true },
		]);
	});

	it('ungroups on a quick second click in the same spot', () => {
		const { session, selects, click } = rig();
		session.sync(payload());
		arm('select');

		click({ x: 0.2, y: 1, z: 0.3 }, { timeStamp: 1000 });
		click({ x: 0.2, y: 1, z: 0.3 }, { timeStamp: 1200 });
		click({ x: 0.2, y: 1, z: 0.3 }, { timeStamp: 2000 });
		click({ x: 0.9, y: 1, z: -0.9 }, { timeStamp: 2100 });
		expect(selects).toEqual([
			{ id: 'box' },
			{ id: 'box', ungroup: true },
			{ id: 'box' },
			{ id: 'box' },
		]);
	});

	it('highlights what a click would pick', () => {
		const { scene, session, rayAt } = rig();
		session.sync(payload({ elementMode: 'face' }));
		arm('select');
		const idle = toolsGroup(scene).children.length;

		session.pointerHover(rayAt({ x: 0.4, y: 1, z: -0.2 }));
		expect(toolsGroup(scene).children.length).toBe(idle + 1);
		session.pointerHover(rayAt({ x: 5, y: 0, z: 5 }));
		expect(toolsGroup(scene).children.length).toBe(idle);
	});

	it('leaves the pointer alone while the level plays', () => {
		const { session, selects, click } = rig();
		session.sync(payload());
		arm('select');
		session.play(levelDocument());

		expect(click({ x: 0.2, y: 1, z: 0.3 })).toBe(false);
		expect(selects).toEqual([]);
	});
});

describe('level drawing', () => {
	it('draws a box: footprint on the ground, a height, then a click', () => {
		const { session, gestures, drag, click, rayAt } = rig();
		session.sync(payload());
		arm('brush');

		drag([
			{ x: 2.1, y: 0, z: -0.9 },
			{ x: 4.2, y: 0, z: -3.8 },
		]);
		expect(gestures).toEqual([]);
		expect(session.hasGesture).toBe(true);
		expect(session.drawPlane?.frame.normal).toEqual({ x: 0, y: 1, z: 0 });

		// Two units up the screen, which is -Z in the Top view.
		session.pointerHover(rayAt({ x: 4.2, y: 0, z: -5.8 }));
		click({ x: 4.2, y: 0, z: -5.8 });
		expect(gestures).toEqual([
			{
				kind: 'primitive',
				frame: frameForPlane({ x: 0, y: 1, z: 0 }, 0),
				footprint: { u0: 2, v0: 1, u1: 4, v1: 4 },
				height: 3,
				shape: BOX_SHAPE,
			},
		]);
		expect(session.hasGesture).toBe(false);
		expect(session.drawPlane).toBeNull();
	});

	it('starts a draw on the face under the pointer', () => {
		const { session, gestures, drag, click } = rig();
		session.sync(payload());
		arm('brush');

		drag([
			{ x: 0.2, y: 1, z: 0.2 },
			{ x: 0.8, y: 1, z: -0.8 },
		]);
		click({ x: 0.8, y: 1, z: -0.8 });
		expect(gestures).toHaveLength(1);
		const gesture = gestures[0] as Extract<LevelGesture, { kind: 'primitive' }>;
		expect(gesture.frame).toEqual(frameForPlane({ x: 0, y: 1, z: 0 }, 1));
		expect(gesture.footprint).toEqual({ u0: 0, v0: 0, u1: 1, v1: 1 });
		expect(gesture.height).toBe(1);
		const [planes] = primitiveBrushes('box', gesture.frame, gesture.footprint, gesture.height)!;
		const bounds = brushBounds(planes!)!;
		expectPoint(bounds.min, { x: 0, y: 1, z: -1 });
		expectPoint(bounds.max, { x: 1, y: 2, z: 0 });
	});

	it('raises the height along the face normal in perspective', () => {
		const camera = perspectiveCamera(new Vector3(5, 7, 9), new Vector3(0, 1, 0));
		const { session, gestures, drag, click, rayAt } = rig({ camera, cameraId: 'editor:free' });
		session.sync(payload());
		arm('brush');

		drag([
			{ x: -0.7, y: 1, z: -0.7 },
			{ x: 0.7, y: 1, z: 0.7 },
		]);
		session.pointerHover(rayAt({ x: 0, y: 4, z: 0 }));
		click({ x: 0, y: 4, z: 0 });
		const gesture = gestures[0] as Extract<LevelGesture, { kind: 'primitive' }>;
		expect(gesture.frame.origin).toEqual({ x: 0, y: 1, z: 0 });
		expect(gesture.footprint).toEqual({ u0: -1, v0: -1, u1: 1, v1: 1 });
		expect(gesture.height).toBeGreaterThan(1);
		expect(Number.isInteger(gesture.height)).toBe(true);
	});

	it('draws on the view plane in the Side view, its height toward the camera', () => {
		const { session, gestures, drag, click, rayAt } = rig({
			camera: sideCamera(),
			cameraId: 'editor:side',
		});
		session.sync(payload());
		arm('brush');

		drag([
			{ x: 0, y: 0.1, z: 2.1 },
			{ x: 0, y: 2.2, z: 4.3 },
		]);
		session.pointerHover(rayAt({ x: 0, y: 4.2, z: 4.3 }));
		click({ x: 0, y: 4.2, z: 4.3 });
		const gesture = gestures[0] as Extract<LevelGesture, { kind: 'primitive' }>;
		expect(gesture.frame).toEqual(frameForPlane({ x: 1, y: 0, z: 0 }, 0));
		expect(gesture.footprint).toEqual({ u0: -4, v0: 0, u1: -2, v1: 2 });
		expect(gesture.height).toBe(3);
		const bounds = brushBounds(
			primitiveBrushes('box', gesture.frame, gesture.footprint, gesture.height)![0]!
		)!;
		expectPoint(bounds.min, { x: 0, y: 0, z: 2 });
		expectPoint(bounds.max, { x: 3, y: 2, z: 4 });
	});

	it('draws on the ground in an isometric view', () => {
		const { session, gestures, drag, click, rayAt } = rig({
			camera: isoCamera(),
			cameraId: 'editor:isometric',
		});
		session.sync(payload());
		arm('brush');

		drag([
			{ x: 2.1, y: 0, z: -2.9 },
			{ x: 4.2, y: 0, z: -1.1 },
		]);
		expect(session.drawPlane?.frame).toEqual(frameForPlane({ x: 0, y: 1, z: 0 }, 0));
		// Height follows travel along the vertical axis through the footprint's centre.
		session.pointerHover(rayAt({ x: 3, y: 2.6, z: -2 }));
		click({ x: 3, y: 2.6, z: -2 });
		drag([
			{ x: 2.1, y: 0, z: -2.9 },
			{ x: 4.2, y: 0, z: -1.1 },
		]);
		session.pointerHover(rayAt({ x: 3, y: 3.6, z: -2 }));
		click({ x: 3, y: 3.6, z: -2 });
		const [lower, higher] = gestures as Array<Extract<LevelGesture, { kind: 'primitive' }>>;
		expect(lower!.footprint).toEqual({ u0: 2, v0: 1, u1: 4, v1: 3 });
		expect(lower!.height).toBeGreaterThan(1);
		expect(higher!.height).toBe(lower!.height + 1);
	});

	it('does nothing for a footprint with no area', () => {
		const { session, gestures, drag } = rig();
		session.sync(payload());
		arm('brush');

		drag([
			{ x: 3.1, y: 0, z: 3.1 },
			{ x: 3.2, y: 0, z: 3.2 },
		]);
		expect(session.hasGesture).toBe(false);
		expect(gestures).toEqual([]);
	});

	it('cancels the height step with Escape', () => {
		const { session, gestures, drag, click } = rig();
		session.sync(payload());
		arm('brush');

		drag([
			{ x: 2, y: 0, z: 2 },
			{ x: 4, y: 0, z: 4 },
		]);
		expect(session.hasGesture).toBe(true);
		session.cancelGesture();
		expect(session.hasGesture).toBe(false);
		expect(session.drawPlane).toBeNull();

		// The next click starts a new footprint instead of committing.
		click({ x: 3, y: 0, z: 3 });
		expect(gestures).toEqual([]);
	});

	it('keeps the height step through a sync and builds the synced shape', () => {
		const { session, gestures, drag, click } = rig();
		const wedge: LevelDrawShape = { ...BOX_SHAPE, shape: 'wedge' };
		session.sync(payload({ drawShape: wedge }));
		arm('brush');

		drag([
			{ x: 2, y: 0, z: 2 },
			{ x: 4, y: 0, z: 4 },
		]);
		session.sync(payload({ drawShape: { ...wedge, turn: 1 } }));
		expect(session.hasGesture).toBe(true);
		click({ x: 4, y: 0, z: 4 });
		expect(gestures).toHaveLength(1);
		expect((gestures[0] as Extract<LevelGesture, { kind: 'primitive' }>).shape).toEqual({
			...wedge,
			turn: 1,
		});
	});
});

describe('level clip', () => {
	it('cuts the selected solid along the line between two clicks', () => {
		const { session, gestures, click } = rig();
		session.sync(payload({ selectedIds: ['box'] }));
		arm('clip');

		click({ x: 0.1, y: 0, z: -3 });
		expect(session.hasGesture).toBe(true);
		click({ x: 0.1, y: 0, z: 3 });
		expect(gestures).toHaveLength(1);
		const gesture = gestures[0] as Extract<LevelGesture, { kind: 'clip' }>;
		expect(gesture.brushIds).toEqual(['box']);
		expect(Math.abs(gesture.plane.normal.x)).toBeCloseTo(1, 9);
		expect(gesture.plane.normal.y).toBeCloseTo(0, 9);
		expect(gesture.plane.normal.z).toBeCloseTo(0, 9);
		expect(gesture.plane.distance).toBeCloseTo(0, 9);
		expect(session.hasGesture).toBe(false);
	});

	it('waits for a third point with Shift and cuts through all three', () => {
		const { session, gestures, click } = rig();
		session.sync(payload({ selectedIds: ['box'] }));
		arm('clip');

		click({ x: -3, y: 0, z: -3 });
		click({ x: 3, y: 0, z: -3 }, { shiftKey: true });
		expect(gestures).toEqual([]);
		// Lands on the box's top face and snaps to (0, 1, 1).
		click({ x: 0.1, y: 1, z: 0.6 });
		const { plane } = gestures[0] as Extract<LevelGesture, { kind: 'clip' }>;
		for (const point of [
			{ x: -3, y: 0, z: -3 },
			{ x: 3, y: 0, z: -3 },
			{ x: 0, y: 1, z: 1 },
		]) {
			const side = plane.normal.x * point.x + plane.normal.y * point.y + plane.normal.z * point.z;
			expect(side).toBeCloseTo(plane.distance, 9);
		}
	});

	it('asks for a selection before clipping', () => {
		const { session, gestures, notices, click } = rig();
		session.sync(payload());
		arm('clip');

		click({ x: 0, y: 0, z: -3 });
		expect(session.hasGesture).toBe(false);
		expect(gestures).toEqual([]);
		expect(notices).toHaveLength(1);
	});
});

describe('level face drags', () => {
	it('pushes a face along its normal by whole grid steps', () => {
		const { session, gestures, selects, drag } = rig();
		session.sync(payload({ elementMode: 'face' }));
		arm('select');

		drag([
			{ x: 0.2, y: 1, z: 0.2 },
			{ x: 0.2, y: 1, z: -1.1 },
			{ x: 0.2, y: 1, z: -1.8 },
		]);
		expect(gestures).toEqual([{ kind: 'face-move', faces: [TOP_FACE], distance: 2 }]);
		expect(selects).toEqual([]);
	});

	it('pulls a side face along its normal in perspective', () => {
		const camera = perspectiveCamera(new Vector3(6, 3, 2), new Vector3(0, 0.5, 0));
		const { session, gestures, drag } = rig({ camera, cameraId: 'editor:free' });
		session.sync(payload({ elementMode: 'face' }));
		arm('select');

		drag([
			{ x: 1, y: 0.5, z: 0.2 },
			{ x: 2.2, y: 0.5, z: 0.2 },
			{ x: 3.1, y: 0.5, z: 0.2 },
		]);
		expect(gestures).toEqual([
			{ kind: 'face-move', faces: [{ brushId: 'box', kind: 'face', planes: [0] }], distance: 2 },
		]);
	});

	it('moves every selected face when the pressed one is selected', () => {
		const { session, gestures, drag } = rig();
		const bottom = { brushId: 'box', kind: 'face' as const, planes: [3] };
		session.sync(
			payload({ elementMode: 'face', selectedIds: ['box'], elements: [TOP_FACE, bottom] })
		);
		arm('select');

		drag([
			{ x: 0.2, y: 1, z: 0.2 },
			{ x: 0.2, y: 1, z: -0.8 },
		]);
		expect(gestures).toEqual([{ kind: 'face-move', faces: [TOP_FACE, bottom], distance: 1 }]);
	});

	it('extrudes a new solid with Alt', () => {
		const { session, gestures, drag } = rig();
		session.sync(payload({ elementMode: 'face' }));
		arm('select');

		drag(
			[
				{ x: 0.2, y: 1, z: 0.2 },
				{ x: 0.2, y: 1, z: -1.8 },
			],
			{ altKey: true }
		);
		expect(gestures).toEqual([{ kind: 'face-extrude', faces: [TOP_FACE], distance: 2 }]);
	});

	it('keeps the last valid step when a push would collapse the solid', () => {
		const { session, gestures, drag } = rig();
		session.sync(payload({ elementMode: 'face' }));
		arm('select');

		drag([
			{ x: 0.2, y: 1, z: 0.2 },
			{ x: 0.2, y: 1, z: -0.8 },
			{ x: 0.2, y: 1, z: 3.2 },
		]);
		expect(gestures).toEqual([{ kind: 'face-move', faces: [TOP_FACE], distance: 1 }]);
	});

	it('reads a drag that comes back to where it began as a click', () => {
		const { session, gestures, selects, drag } = rig();
		session.sync(payload({ elementMode: 'face' }));
		arm('select');

		drag([
			{ x: 0.2, y: 1, z: 0.2 },
			{ x: 0.2, y: 1, z: -1.8 },
			{ x: 0.2, y: 1, z: 0.25 },
		]);
		expect(gestures).toEqual([]);
		expect(selects).toEqual([{ id: 'box', elements: [TOP_FACE] }]);
	});

	it('shears a selected face within its own plane', () => {
		const { session, gestures, drag } = rig();
		session.sync(payload({ elementMode: 'face', selectedIds: ['box'], elements: [TOP_FACE] }));
		arm('shear');

		drag([
			{ x: 0, y: 1, z: 0 },
			{ x: 1.1, y: 1, z: 0.2 },
		]);
		expect(gestures).toEqual([{ kind: 'shear', faces: [TOP_FACE], delta: { x: 1, y: 0, z: 0 } }]);
	});

	it('moves a vertex on the plane the camera faces, onto grid points', () => {
		const { session, gestures, drag } = rig();
		session.sync(payload({ elementMode: 'vertex' }));
		arm('select');

		drag([
			{ x: 1.05, y: 1, z: 1.05 },
			{ x: 2.2, y: 1, z: 1.1 },
		]);
		expect(gestures).toEqual([
			{
				kind: 'element-move',
				elements: [{ brushId: 'box', kind: 'vertex', planes: [0, 2, 4] }],
				delta: { x: 1, y: 0, z: 0 },
			},
		]);
	});
});

describe('level gizmo', () => {
	it('moves the selected solid along a handle and reports one transform', () => {
		const { session, gestures, drag } = rig();
		arm('translate');
		session.sync(payload({ selectedIds: ['box'] }));
		session.tick();

		// The X handle runs from the pivot (0, 0.5, 0) along +X.
		drag([
			{ x: 1.3, y: 0.5, z: 0 },
			{ x: 2.4, y: 0.5, z: 0 },
			{ x: 3.4, y: 0.5, z: 0 },
		]);
		expect(gestures).toEqual([
			{
				kind: 'transform',
				ids: ['box'],
				transform: { kind: 'translate', delta: { x: 2, y: 0, z: 0 } },
			},
		]);
	});

	it('moves selected elements as an element move', () => {
		const { session, gestures, drag } = rig();
		arm('translate');
		session.sync(payload({ elementMode: 'face', selectedIds: ['box'], elements: [TOP_FACE] }));
		session.tick();

		// The pivot is the top face's centre, (0, 1, 0).
		drag([
			{ x: 1.3, y: 1, z: 0 },
			{ x: 2.3, y: 1, z: 0 },
		]);
		expect(gestures).toEqual([
			{ kind: 'element-move', elements: [TOP_FACE], delta: { x: 1, y: 0, z: 0 } },
		]);
	});

	it('turns the selection about its centre in snapped steps', () => {
		const { session, gestures, drag } = rig();
		arm('rotate');
		session.sync(payload({ selectedIds: ['box'] }));
		session.tick();

		// The Y ring lies flat around the pivot (0, 0.5, 0); a quarter turn takes +X to -Z.
		const radius = 0.68 * 12 * 0.16;
		drag([
			{ x: radius, y: 0.5, z: 0 },
			{ x: radius * Math.SQRT1_2, y: 0.5, z: -radius * Math.SQRT1_2 },
			{ x: 0.02, y: 0.5, z: -radius },
		]);
		expect(gestures).toHaveLength(1);
		const gesture = gestures[0] as Extract<LevelGesture, { kind: 'transform' }>;
		expect(gesture.ids).toEqual(['box']);
		expect(gesture.transform.kind).toBe('rotate');
		const rotate = gesture.transform as Extract<typeof gesture.transform, { kind: 'rotate' }>;
		expect(rotate.axis).toEqual({ x: 0, y: 1, z: 0 });
		expect(rotate.angle).toBeCloseTo(Math.PI / 2, 9);
		expect(rotate.pivot).toEqual({ x: 0, y: 0.5, z: 0 });
	});

	it('scales the selection along a handle in snapped factors', () => {
		const { session, gestures, drag } = rig();
		arm('scale');
		session.sync(payload({ selectedIds: ['box'] }));
		session.tick();

		drag([
			{ x: 1.2, y: 0.5, z: 0 },
			{ x: 2.41, y: 0.5, z: 0 },
		]);
		expect(gestures).toEqual([
			{
				kind: 'transform',
				ids: ['box'],
				transform: { kind: 'scale', factor: { x: 2, y: 1, z: 1 }, pivot: { x: 0, y: 0.5, z: 0 } },
			},
		]);
	});

	it('rotates the owning solid when elements are selected', () => {
		const { session, gestures, drag } = rig();
		arm('rotate');
		session.sync(payload({ elementMode: 'face', selectedIds: ['box'], elements: [TOP_FACE] }));
		session.tick();

		const radius = 0.68 * 12 * 0.16;
		drag([
			{ x: radius, y: 1, z: 0 },
			{ x: 0.02, y: 1, z: -radius },
		]);
		const gesture = gestures[0] as Extract<LevelGesture, { kind: 'transform' }>;
		expect(gesture.ids).toEqual(['box']);
		expect(gesture.transform).toMatchObject({ kind: 'rotate', pivot: { x: 0, y: 1, z: 0 } });
	});

	it('selects with a click off the handles and leaves empty space to the camera', () => {
		const { session, selects, click } = rig();
		arm('translate');
		session.sync(payload());
		session.tick();

		expect(click({ x: -0.5, y: 1, z: -0.5 }, { timeStamp: 0 })).toBe(true);
		expect(click({ x: 5, y: 0, z: 5 }, { timeStamp: 1000 })).toBe(false);
		expect(selects).toEqual([{ id: 'box' }]);
	});

	it('drags and Shift-picks elements off the handles as Select does', () => {
		const { session, gestures, selects, drag, click } = rig();
		arm('translate');
		session.sync(payload({ elementMode: 'face', selectedIds: ['box'], elements: [TOP_FACE] }));
		session.tick();

		// The handles stand on the top face's centre; this corner of it is clear of them.
		drag(
			[
				{ x: -0.6, y: 1, z: -0.6 },
				{ x: -0.6, y: 1, z: -2.6 },
			],
			{ altKey: true }
		);
		expect(click({ x: -0.6, y: 1, z: -0.6 }, { shiftKey: true, timeStamp: 1000 })).toBe(true);
		expect(gestures).toEqual([{ kind: 'face-extrude', faces: [TOP_FACE], distance: 2 }]);
		expect(selects).toEqual([{ id: 'box', elements: [TOP_FACE], additive: true }]);
	});
});
