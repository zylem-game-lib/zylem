import { Mesh, Scene, Vector3, type Group } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createBox } from '../../../src/lib/entities/box';
import { createHoverArea, createDroppableArea } from '../../../src/lib/entities/hover-area';
import { debugState } from '../../../src/lib/debug/debug-state';
import { entityRepresentative } from '../../../src/lib/stage/entity-representative';
import {
	StagePointerDelegate,
	type StagePointerHost,
} from '../../../src/lib/stage/stage-pointer-delegate';
import type { GizmoRay } from '../../../src/lib/debug/transform-gizmo';
import type { PlacementHit } from '../../../src/lib/stage/placement-geometry';
import { createStage } from '../../../src/lib/stage/stage';

function downRay(x: number, z = 0, y = 5): GizmoRay {
	return {
		origin: new Vector3(x, y, z),
		direction: new Vector3(0, -1, 0),
	};
}

function harness(raycast: StagePointerHost['raycast'] = () => null) {
	const scene = new Scene();
	const added: unknown[] = [];
	const host: StagePointerHost = {
		getScene: () => scene,
		raycast,
		addSpawn: (entity) => {
			added.push(entity);
		},
		getCanvas: () => null,
		getCamera: () => null,
	};
	const delegate = new StagePointerDelegate(host);
	return { scene, added, delegate };
}

function previewMesh(scene: Scene): Mesh | null {
	const container = scene.getObjectByName('EntityRepresentative') as Group | undefined;
	let mesh: Mesh | null = null;
	container?.traverse((node) => {
		if ((node as Mesh).isMesh) mesh = node as Mesh;
	});
	return mesh;
}

let delegate: StagePointerDelegate | null = null;

afterEach(() => {
	delegate?.dispose();
	delegate = null;
	debugState.enabled = false;
	debugState.tool = 'none';
	debugState.pickMode = false;
});

describe('StagePointerDelegate', () => {
	it('reports the nearest area once per transition', () => {
		const events = {
			enter: [] as string[],
			leave: [] as string[],
			move: [] as string[],
		};
		const track = (name: string) => ({
			onEnter: () => events.enter.push(name),
			onLeave: () => events.leave.push(name),
			onMove: () => events.move.push(name),
		});

		// The larger box reaches higher, so a ray from above hits it first even
		// though both volumes contain the ray.
		const near = createHoverArea({
			position: { x: 0, y: 0, z: 0 },
			size: { x: 4, y: 4, z: 4 },
			...track('near'),
		});
		const far = createHoverArea({
			position: { x: 0, y: 0, z: 0 },
			size: { x: 0.5, y: 0.5, z: 0.5 },
			...track('far'),
		});
		const beside = createHoverArea({
			position: { x: 6, y: 0, z: 0 },
			size: { x: 2, y: 2, z: 2 },
			...track('beside'),
		});

		const rig = harness();
		delegate = rig.delegate;
		delegate.registerTarget(near);
		delegate.registerTarget(far);
		delegate.registerTarget(beside);
		delegate.setRay(downRay(0));

		delegate.update(0.016);

		expect(events.enter).toEqual(['near']);
		expect(events.leave).toEqual([]);
		expect(events.move).toEqual(['near']);

		delegate.setRay(downRay(6));
		delegate.update(0.016);

		expect(events.enter).toEqual(['near', 'beside']);
		expect(events.leave).toEqual(['near']);
		expect(events.move).toEqual(['near', 'beside']);
	});

	it('snaps onto an accepting droppable and rejects a miss', () => {
		const spawn = vi.fn(() => ({ id: 'tower' }));
		const cell = createBox({
			position: { x: 1, y: 0, z: 1 },
			size: { x: 1, y: 1, z: 1 },
		}).droppableArea({
			accepts: (payload) => payload === 'tower',
		});

		const rig = harness();
		delegate = rig.delegate;
		delegate.registerTarget(cell);
		delegate.arm({
			payload: 'tower',
			representative: entityRepresentative(() => createBox(), {
				fadeIn: 0.12,
				valid: { opacity: 0.8 },
				invalid: { opacity: 0.2 },
			}),
			spawnOnClick: spawn,
		});

		delegate.setRay(downRay(10, 10));
		delegate.update(1);
		expect(spawn).not.toHaveBeenCalled();
		expect(delegate.pointerDown(0)).toBe(false);
		expect(spawn).not.toHaveBeenCalled();
		expect(delegate.previewOpacity).toBeCloseTo(0.2);
		expect(rig.added).toEqual([]);

		// Over the cell, but the payload is not one it accepts: the preview
		// still sits on the cell, and the click does not spawn.
		delegate.setPayload('wall');
		delegate.setRay(downRay(1, 1));
		delegate.update(1);
		expect(delegate.pointerDown(0)).toBe(false);
		expect(spawn).not.toHaveBeenCalled();
		expect(delegate.previewOpacity).toBeCloseTo(0.2);
		expect(delegate.previewPosition?.x).toBeCloseTo(1);
		expect(delegate.previewPosition?.y).toBeCloseTo(0);
		expect(delegate.previewPosition?.z).toBeCloseTo(1);

		delegate.setPayload('tower');
		delegate.setRay(downRay(1, 1));
		delegate.update(1);
		expect(delegate.previewOpacity).toBeCloseTo(0.8);
		expect(delegate.previewPosition?.x).toBeCloseTo(1);
		expect(delegate.previewPosition?.y).toBeCloseTo(0);
		expect(delegate.previewPosition?.z).toBeCloseTo(1);
	});

	it('spawns on a valid click and fades out unless the session repeats', () => {
		const spawned = { id: 'tower' };
		const spawn = vi.fn(() => spawned);
		const onDrop = vi.fn();
		const onClick = vi.fn();
		const cell = createDroppableArea({
			position: { x: 0, y: 0, z: 0 },
			size: { x: 2, y: 2, z: 2 },
		}).onDrop(onDrop).onClick(onClick);

		const rig = harness();
		delegate = rig.delegate;
		delegate.registerTarget(cell);
		delegate.arm({
			representative: entityRepresentative(() => createBox(), { fadeOut: 0.2 }),
			spawnOnClick: spawn,
		});
		delegate.setRay(downRay(0));
		delegate.update(0.016);

		expect(delegate.pointerDown(0)).toBe(true);
		expect(rig.added).toEqual([spawned]);
		expect(onDrop).toHaveBeenCalledOnce();
		expect(onClick).not.toHaveBeenCalled();
		expect(delegate.isPlacing).toBe(false);
		expect(rig.scene.getObjectByName('EntityRepresentative')).toBeTruthy();

		delegate.pointerDown(0);
		expect(rig.added).toHaveLength(1);

		delegate.update(1);
		expect(rig.scene.getObjectByName('EntityRepresentative')).toBeUndefined();
	});

	it('does not spawn when spawnOnClick rejects the click', () => {
		const spawn = vi.fn(() => false as const);
		const rig = harness();
		delegate = rig.delegate;
		delegate.arm({
			representative: entityRepresentative(() => createBox()),
			spawnOnClick: spawn,
		});
		delegate.setRay(downRay(0));
		delegate.update(0.016);

		expect(delegate.pointerDown(0)).toBe(false);
		expect(spawn).toHaveBeenCalledOnce();
		expect(rig.added).toEqual([]);
		expect(delegate.isPlacing).toBe(true);
	});

	it('keeps placing when repeat is set', () => {
		const spawn = vi.fn(() => ({ id: 'again' }));
		const rig = harness();
		delegate = rig.delegate;
		delegate.arm({
			repeat: true,
			representative: entityRepresentative(() => createBox()),
			spawnOnClick: spawn,
		});
		delegate.setRay(downRay(0));
		delegate.update(0.016);
		delegate.pointerDown(0);
		delegate.pointerDown(0);

		expect(rig.added).toHaveLength(2);
		expect(delegate.isPlacing).toBe(true);
	});

	it('eases the representative opacity and does not spawn it', () => {
		let source: Mesh | null = null;
		const rig = harness();
		delegate = rig.delegate;
		delegate.arm({
			representative: entityRepresentative(() => {
				const box = createBox();
				source = box.mesh ?? null;
				return box;
			}, {
				fadeIn: 0.2,
				opacity: 0.8,
				valid: { opacity: 0.8 },
			}),
		});
		delegate.setRay(downRay(0));

		expect(delegate.previewOpacity).toBe(0);
		expect(rig.added).toEqual([]);
		expect(rig.scene.getObjectByName('EntityRepresentative')).toBeTruthy();

		delegate.update(0.1);
		expect(delegate.previewOpacity).toBeGreaterThan(0);
		expect(delegate.previewOpacity).toBeLessThan(0.8);

		delegate.update(0.1);
		expect(delegate.previewOpacity).toBeCloseTo(0.8);

		const mesh = previewMesh(rig.scene);
		expect(mesh).not.toBe(source);
		expect(mesh?.geometry).not.toBe(source?.geometry);
		expect(mesh?.castShadow).toBe(false);
		const material = mesh?.material as { transparent: boolean; depthWrite: boolean; opacity: number };
		expect(material.transparent).toBe(true);
		expect(material.depthWrite).toBe(false);
		expect(material.opacity).toBeCloseTo(0.8);
		expect(rig.added).toEqual([]);
	});

	it('rests a free placement on a physics hit', () => {
		const rig = harness(() => ({ distance: 2, normal: [0, 1, 0] }) satisfies PlacementHit);
		delegate = rig.delegate;
		delegate.arm({
			representative: entityRepresentative(() => createBox({ size: { x: 1, y: 1, z: 1 } })),
		});
		delegate.setRay(downRay(0, 0, 5));
		delegate.update(1);

		// Ray starts at y=5 and hits after 2 units (y=3). A unit cube then
		// rests half its height above that surface.
		expect(delegate.previewPosition?.y).toBeCloseTo(3.5);
		expect(delegate.previewPosition?.x).toBeCloseTo(0);
		expect(delegate.previewPosition?.z).toBeCloseTo(0);
	});

	it('skips hover while the editor owns the pointer', () => {
		const enter = vi.fn();
		const area = createHoverArea({
			position: { x: 0, y: 0, z: 0 },
			size: { x: 2, y: 2, z: 2 },
		}).onEnter(enter);
		const rig = harness();
		delegate = rig.delegate;
		delegate.registerTarget(area);
		delegate.arm({
			representative: entityRepresentative(() => createBox()),
			spawnOnClick: () => ({ id: 'nope' }),
		});
		delegate.setRay(downRay(0));
		debugState.enabled = true;

		delegate.update(0.016);
		expect(enter).not.toHaveBeenCalled();
		expect(delegate.pointerDown(0)).toBe(false);
		expect(rig.added).toEqual([]);
		expect(delegate.isPlacing).toBe(true);

		debugState.enabled = false;
		delegate.update(0.016);
		expect(enter).toHaveBeenCalledOnce();
	});

	it('cancels on right click and escape', () => {
		const rig = harness();
		delegate = rig.delegate;
		delegate.arm({
			representative: entityRepresentative(() => createBox(), { fadeOut: 0 }),
		});
		delegate.setRay(downRay(0));

		expect(delegate.pointerDown(2)).toBe(true);
		expect(delegate.isPlacing).toBe(false);

		delegate.arm({
			representative: entityRepresentative(() => createBox(), { fadeOut: 0 }),
		});
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		expect(delegate.isPlacing).toBe(false);
	});

	it('keeps a hover click on a cloned area', () => {
		const clicked = vi.fn();
		const area = createHoverArea({
			position: { x: 0, y: 0, z: 0 },
			size: { x: 2, y: 2, z: 2 },
		}).onClick(clicked);
		const clone = area.clone();

		const rig = harness();
		delegate = rig.delegate;
		delegate.registerTarget(clone);
		delegate.setRay(downRay(0));

		expect(delegate.pointerDown(0)).toBe(true);
		expect(clicked).toHaveBeenCalledOnce();
		expect(clicked.mock.calls[0]?.[0]?.area).toBe(clone);
	});

	it('queues a placement armed before the stage loads', () => {
		const stage = createStage();
		const session = stage.armPlacement({
			payload: 'tower',
			representative: entityRepresentative(() => createBox()),
			spawnOnClick: () => false,
		});
		session.setPayload('wall');
		expect(() => session.cancel()).not.toThrow();
		stage.cancelPlacement();
	});
});
