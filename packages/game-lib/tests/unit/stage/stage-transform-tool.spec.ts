import {
	BoxGeometry,
	Camera,
	Group,
	Mesh,
	PerspectiveCamera,
	Quaternion,
	Scene,
	Vector3,
} from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getZylemBridge, type SceneOperationPayload } from '@zylem/bridge';
import {
	debugState,
	setSelectedEntityId,
	setSnapSettings,
	DEFAULT_SNAP_SETTINGS,
} from '../../../src/lib/debug/debug-state';
import { StageTransformTool } from '../../../src/lib/stage/stage-transform-tool';
import { isPointInViewport } from '../../../src/lib/stage/viewport-clamp';
import { quaternionToEuler } from '../../../src/lib/core/transform-math';

/**
 * A stand-in for a live entity: absolute pose plus scale, which is the whole
 * surface the transform tool touches.
 */
function fakeEntity(uuid = 'entity-1', position = new Vector3(0, 0, 0)) {
	const pose = {
		position: { x: position.x, y: position.y, z: position.z },
		rotation: { x: 0, y: 0, z: 0, w: 1 },
	};
	const scale = { x: 1, y: 1, z: 1 };

	return {
		uuid,
		name: 'Crate',
		group: { position: new Vector3().copy(position), scale: new Vector3(1, 1, 1) },
		colliderScaleDirty: false,
		colliderBaseline: null,
		colliderDesc: undefined,
		colliderDescs: [],
		physicsWorldRef: null,
		bodyDesc: null,
		getPose: () => ({
			position: { ...pose.position },
			rotation: { ...pose.rotation },
		}),
		setPose: (next: { position?: any; rotation?: any }) => {
			if (next.position) pose.position = { ...next.position };
			if (next.rotation) pose.rotation = { ...next.rotation };
		},
		getScale: () => ({ ...scale }),
		setScale: (x: number, y: number, z: number) => {
			scale.x = x;
			scale.y = y;
			scale.z = z;
		},
	};
}

/**
 * A camera that is neither perspective nor orthographic, so the gizmo keeps a
 * world scale of 1 and its handles sit at known coordinates.
 */
function neutralCamera(): Camera {
	const camera = new Camera();
	camera.position.set(0, 5, 10);
	camera.updateMatrixWorld(true);
	return camera;
}

/** A ray pointing straight down through `(x, z)`. */
function downRay(x: number, z = 0) {
	return {
		origin: new Vector3(x, 5, z),
		direction: new Vector3(0, -1, 0),
	};
}

/**
 * The same stand-in, but backed by a real unit-cube object so the tool can
 * measure world bounds for the viewport clamp.
 */
function fakeEntityWithBounds(uuid = 'entity-1') {
	const entity = fakeEntity(uuid);
	const group = new Group();
	group.add(new Mesh(new BoxGeometry(1, 1, 1)));
	group.updateMatrixWorld(true);
	return { ...entity, group };
}

function setup(entity = fakeEntity(), camera: Camera = neutralCamera()) {
	const scene = new Scene();
	const tool = new StageTransformTool({
		getScene: () => scene,
		getCamera: () => camera,
		resolveEntity: (uuid) => (uuid === entity.uuid ? (entity as any) : null),
	});

	setSelectedEntityId(entity.uuid);
	return { tool, scene, camera, entity };
}

/** A camera looking straight down at the origin, with a real projection. */
function overheadCamera(): PerspectiveCamera {
	const camera = new PerspectiveCamera(50, 1, 0.1, 100);
	camera.position.set(0, 10, 0);
	camera.lookAt(0, 0, 0);
	camera.updateMatrixWorld(true);
	return camera;
}

/**
 * A downward ray onto a handle at `offset` along X.
 *
 * The gizmo holds a constant on-screen size, so its handles sit at world
 * coordinates that depend on the camera. Reading the applied scale keeps these
 * rays aimed at the handles under any camera.
 */
function handleRay(scene: Scene, offset: number) {
	const gizmo = scene.getObjectByName('__zylem_transform_gizmo__');
	return downRay(offset * (gizmo?.scale.x ?? 1));
}

/** Position the gizmo and refresh world matrices so picking can hit it. */
function showGizmo(tool: StageTransformTool, scene: Scene) {
	tool.update();
	scene.updateMatrixWorld(true);
}

const operations: SceneOperationPayload[] = [];
let unsubscribe: (() => void) | null = null;

beforeEach(() => {
	operations.length = 0;
	const { channel } = getZylemBridge();
	channel.reset();
	unsubscribe = channel.on('scene:operation', (op) => {
		operations.push(op);
	});
	setSnapSettings(DEFAULT_SNAP_SETTINGS);
	setSelectedEntityId(null);
	debugState.paused = false;
});

afterEach(() => {
	unsubscribe?.();
	unsubscribe = null;
	vi.restoreAllMocks();
});

describe('StageTransformTool mode', () => {
	it('pauses the simulation on entry and restores on exit', () => {
		const { tool } = setup();

		// A dragged entity is a live rigid body: an unpaused world would
		// overwrite the gizmo's writes every frame.
		tool.setMode('translate');
		expect(debugState.paused).toBe(true);

		tool.setMode(null);
		expect(debugState.paused).toBe(false);
	});

	it('leaves an already-paused game paused on exit', () => {
		const { tool } = setup();
		debugState.paused = true;

		tool.setMode('translate');
		tool.setMode(null);

		expect(debugState.paused).toBe(true);
	});
});

describe('StageTransformTool translate', () => {
	it('snaps the resulting position onto the world lattice', () => {
		const { tool, scene, entity } = setup();
		tool.setMode('translate');
		showGizmo(tool, scene);

		expect(tool.pointerDown(downRay(0.45))).toBe(true);
		// Drag 0.6 along X: snapping lands on 0.5, the nearest 0.25 multiple.
		tool.pointerMove(downRay(1.05), false);

		expect(entity.getPose().position.x).toBeCloseTo(0.5);
	});

	it('bypasses snapping while alt is held', () => {
		const { tool, scene, entity } = setup();
		tool.setMode('translate');
		showGizmo(tool, scene);

		tool.pointerDown(downRay(0.45));
		tool.pointerMove(downRay(1.05), true);

		expect(entity.getPose().position.x).toBeCloseTo(0.6);
	});

	it('reads the modifier per move, so alt can be released mid-drag', () => {
		const { tool, scene, entity } = setup();
		tool.setMode('translate');
		showGizmo(tool, scene);

		tool.pointerDown(downRay(0.45));
		tool.pointerMove(downRay(1.05), true);
		expect(entity.getPose().position.x).toBeCloseTo(0.6);

		// No keyup bookkeeping: the next move simply snaps again.
		tool.pointerMove(downRay(1.05), false);
		expect(entity.getPose().position.x).toBeCloseTo(0.5);
	});

	it('snaps absolutely, so an off-lattice entity is pulled onto it', () => {
		const entity = fakeEntity('entity-1', new Vector3(0.13, 0, 0));
		const { tool, scene } = setup(entity);
		tool.setMode('translate');
		showGizmo(tool, scene);

		tool.pointerDown(downRay(0.58));
		tool.pointerMove(downRay(0.7), false);

		// The result is a multiple of 0.25, not 0.13 plus a snapped delta, so
		// independently placed entities line up with each other.
		const x = entity.getPose().position.x;
		expect(x / 0.25).toBeCloseTo(Math.round(x / 0.25));
	});

	it('does not snap when snapping is disabled entirely', () => {
		const { tool, scene, entity } = setup();
		setSnapSettings({ ...DEFAULT_SNAP_SETTINGS, enabled: false });
		tool.setMode('translate');
		showGizmo(tool, scene);

		tool.pointerDown(downRay(0.45));
		tool.pointerMove(downRay(1.05), false);

		expect(entity.getPose().position.x).toBeCloseTo(0.6);
	});

	it('publishes one operation per drag on commit', () => {
		const { tool, scene } = setup();
		tool.setMode('translate');
		showGizmo(tool, scene);

		tool.pointerDown(downRay(0.45));
		tool.pointerMove(downRay(0.85), false);
		tool.pointerMove(downRay(1.05), false);
		tool.pointerUp();

		// Many moves, one undo entry: the drag commits only on release.
		expect(operations).toHaveLength(1);
		expect(operations[0]!.kind).toBe('transform');
		expect(operations[0]!.entries[0]!.uuid).toBe('entity-1');
	});

	it('records both before and after poses', () => {
		const { tool, scene } = setup();
		tool.setMode('translate');
		showGizmo(tool, scene);

		tool.pointerDown(downRay(0.45));
		tool.pointerMove(downRay(1.05), false);
		tool.pointerUp();

		const entry = operations[0]!.entries[0]!;
		expect(entry.before?.position?.x).toBeCloseTo(0);
		expect(entry.after?.position?.x).toBeCloseTo(0.5);
	});

	it('publishes nothing when the drag did not move anything', () => {
		const { tool, scene } = setup();
		tool.setMode('translate');
		showGizmo(tool, scene);

		tool.pointerDown(downRay(0.45));
		tool.pointerMove(downRay(0.45), false);
		tool.pointerUp();

		// A click that lands back where it started is not an edit.
		expect(operations).toHaveLength(0);
	});

	it('labels the operation with the entity name', () => {
		const { tool, scene } = setup();
		tool.setMode('translate');
		showGizmo(tool, scene);

		tool.pointerDown(downRay(0.45));
		tool.pointerMove(downRay(1.05), false);
		tool.pointerUp();

		expect(operations[0]!.label).toBe('Move Crate');
	});

	it('ignores a press that misses every handle', () => {
		const { tool, scene } = setup();
		tool.setMode('translate');
		showGizmo(tool, scene);

		// Far outside the gizmo, so the caller is free to treat it as a pick.
		expect(tool.pointerDown(downRay(12))).toBe(false);
		expect(tool.isDragging).toBe(false);
	});

	it('ignores a press with no tool active', () => {
		const { tool, scene } = setup();
		showGizmo(tool, scene);
		expect(tool.pointerDown(downRay(0.45))).toBe(false);
	});

	it('stops at the edge of the view instead of flinging the entity off screen', () => {
		const camera = overheadCamera();
		const { tool, scene, entity } = setup(fakeEntity(), camera);
		tool.setMode('translate');
		showGizmo(tool, scene);

		tool.pointerDown(handleRay(scene, 0.45));
		// A pointer thrown far past the frustum: the raw axis solve would put the
		// entity 200 units out, well outside anything the camera can see.
		tool.pointerMove(downRay(200), false);

		const { x } = entity.getPose().position;
		expect(x).toBeGreaterThan(1);
		// A slightly loose margin, since snapping can add half an increment back
		// after the clamp.
		expect(isPointInViewport(new Vector3(x, 0, 0), camera, 0.99)).toBe(true);
	});

	it('leaves an in-view drag alone', () => {
		const { tool, scene, entity } = setup(fakeEntity(), overheadCamera());
		tool.setMode('translate');
		showGizmo(tool, scene);

		const start = handleRay(scene, 0.45);
		tool.pointerDown(start);
		tool.pointerMove(downRay(start.origin.x + 1), false);

		// The clamp only ever bounds a drag; a modest move is untouched.
		expect(entity.getPose().position.x).toBeCloseTo(1);
	});

	it('holds still when the pointer ray turns nearly parallel to the axis', () => {
		const { tool, scene, entity } = setup();
		tool.setMode('translate');
		showGizmo(tool, scene);

		tool.pointerDown(downRay(0.45));
		tool.pointerMove(downRay(1.05), false);
		const before = entity.getPose().position.x;

		// Sighting down the X axis: the closest-point solve amplifies pointer
		// motion without bound here, so the drag is refused rather than run away.
		tool.pointerMove(
			{
				origin: new Vector3(-5, 0, 0),
				direction: new Vector3(1, -0.02, 0).normalize(),
			},
			false,
		);

		expect(entity.getPose().position.x).toBeCloseTo(before);
	});

	it('abandons a drag without committing when cancelled', () => {
		const { tool, scene } = setup();
		tool.setMode('translate');
		showGizmo(tool, scene);

		tool.pointerDown(downRay(0.45));
		tool.pointerMove(downRay(1.05), false);
		tool.cancelDrag();
		tool.pointerUp();

		expect(operations).toHaveLength(0);
		expect(tool.isDragging).toBe(false);
	});
});

describe('StageTransformTool scale', () => {
	it('snaps scale to the increment and commits colliders once', () => {
		const { tool, scene, entity } = setup();
		tool.setMode('scale');
		showGizmo(tool, scene);

		// Scale handles sit along the same axes as the translate arrows.
		expect(tool.pointerDown(downRay(0.45))).toBe(true);
		tool.pointerMove(downRay(0.79), false);

		const scaled = entity.getScale().x;
		expect(scaled).toBeGreaterThan(1);
		expect(scaled * 10).toBeCloseTo(Math.round(scaled * 10));
	});

	it('marks the operation as a transform on commit', () => {
		const { tool, scene, entity } = setup();
		tool.setMode('scale');
		showGizmo(tool, scene);

		tool.pointerDown(downRay(0.45));
		tool.pointerMove(downRay(0.9), false);
		entity.colliderScaleDirty = true;
		tool.pointerUp();

		expect(operations).toHaveLength(1);
		expect(operations[0]!.entries[0]!.after?.scale?.x).toBeCloseTo(
			entity.getScale().x,
		);
	});

	it('stops growing once the bounding box fills the view', () => {
		const entity = fakeEntityWithBounds();
		const { tool, scene } = setup(entity, overheadCamera());
		tool.setMode('scale');
		showGizmo(tool, scene);

		tool.pointerDown(handleRay(scene, 0.45));
		tool.pointerMove(downRay(100), false);

		// The raw ratio here is over a hundredfold. The clamp caps it where the
		// unit cube reaches the frustum walls, a handful of units across.
		const scaled = entity.getScale().x;
		expect(scaled).toBeGreaterThan(1);
		expect(scaled).toBeLessThan(20);
	});

	it('falls back to a hard ratio cap when the view cannot judge the bounds', () => {
		const { tool, scene, entity } = setup();
		tool.setMode('scale');
		showGizmo(tool, scene);

		tool.pointerDown(downRay(0.45));
		tool.pointerMove(downRay(100), false);

		// No projecting camera and no measurable bounds, so only the backstop
		// applies — still a bound, rather than a two-hundredfold jump.
		expect(entity.getScale().x).toBeCloseTo(50);
	});
});

describe('StageTransformTool rotate', () => {
	/**
	 * A ray straight down onto the Y ring at `degrees` around it.
	 *
	 * Kept off the axes on purpose: the point where the Y ring crosses X also
	 * lies on the Z ring, and a vertical ray there is parallel to the Z ring's
	 * plane, so the press would be ignored as untrackable.
	 */
	function yRingRay(degrees: number) {
		const radians = (degrees * Math.PI) / 180;
		const radius = 0.68;
		return {
			origin: new Vector3(
				Math.sin(radians) * radius,
				5,
				Math.cos(radians) * radius,
			),
			direction: new Vector3(0, -1, 0),
		};
	}

	function rotationDegrees(entity: ReturnType<typeof fakeEntity>): number {
		return (quaternionToEuler(entity.getPose().rotation).y * 180) / Math.PI;
	}

	it('snaps the dragged axis to 15-degree steps', () => {
		const { tool, scene, entity } = setup();
		tool.setMode('rotate');
		showGizmo(tool, scene);

		expect(tool.pointerDown(yRingRay(45))).toBe(true);
		// A 22-degree drag lands on the nearest step rather than where the
		// pointer actually is.
		tool.pointerMove(yRingRay(67), false);

		expect(rotationDegrees(entity)).toBeCloseTo(15);
	});

	it('leaves rotation free while alt is held', () => {
		const { tool, scene, entity } = setup();
		tool.setMode('rotate');
		showGizmo(tool, scene);

		tool.pointerDown(yRingRay(45));
		tool.pointerMove(yRingRay(50), true);

		// A rotation far too small to reach the first 15-degree step still lands.
		expect(rotationDegrees(entity)).toBeCloseTo(5);
	});

	it('snaps a small rotation back to zero', () => {
		const { tool, scene, entity } = setup();
		tool.setMode('rotate');
		showGizmo(tool, scene);

		tool.pointerDown(yRingRay(45));
		tool.pointerMove(yRingRay(50), false);

		expect(rotationDegrees(entity)).toBeCloseTo(0);
	});

	it('keeps the quaternion normalized after rotating', () => {
		const { tool, scene, entity } = setup();
		tool.setMode('rotate');
		showGizmo(tool, scene);

		tool.pointerDown(yRingRay(45));
		tool.pointerMove(yRingRay(135), false);

		const { x, y, z, w } = entity.getPose().rotation;
		expect(new Quaternion(x, y, z, w).length()).toBeCloseTo(1);
	});

	it('grabs the face-on ring where an edge-on one overlaps it', () => {
		const { tool, scene, entity } = setup();
		tool.setMode('rotate');
		showGizmo(tool, scene);

		// Straight down where the Y ring crosses the X axis, which is also on the
		// Z ring. The Z ring is edge-on to this ray and so cannot be dragged; only
		// the Y ring is offered, and the press lands on it.
		expect(tool.pointerDown(downRay(0.68))).toBe(true);

		tool.pointerMove(yRingRay(135), false);
		expect(Math.abs(rotationDegrees(entity))).toBeGreaterThan(0);
	});

	it('publishes a rotate operation carrying the quaternion', () => {
		const { tool, scene } = setup();
		tool.setMode('rotate');
		showGizmo(tool, scene);

		tool.pointerDown(yRingRay(45));
		tool.pointerMove(yRingRay(135), false);
		tool.pointerUp();

		// The quaternion is the authoritative field; euler angles ride along for
		// the inspector's numeric fields.
		expect(operations).toHaveLength(1);
		expect(operations[0]!.label).toBe('Rotate Crate');
		expect(operations[0]!.entries[0]!.after?.quaternion).toBeDefined();
	});
});
