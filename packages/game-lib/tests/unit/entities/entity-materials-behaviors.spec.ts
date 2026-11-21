import { Mesh, MeshStandardMaterial, BoxGeometry } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { defineBehavior } from '@zylem/behaviors/core';
import { color } from 'three/tsl';

import { createBox } from '../../../src/lib/entities/box';
import { createZone } from '../../../src/lib/entities/zone';

const Thruster = defineBehavior({
	name: 'test-thruster',
	defaultOptions: { thrust: 1 },
	systemFactory: () => ({ update() {} }),
});
const Wrap = defineBehavior({
	name: 'test-wrap',
	defaultOptions: { width: 10 },
	systemFactory: () => ({ update() {} }),
});

describe('GameEntity.setMaterial', () => {
	it('swaps the mesh material and reports the replaced one', () => {
		const box = createBox({});
		const original = box.mesh!.material as MeshStandardMaterial;
		expect(box.hasMaterial()).toBe(true);

		const previous = box.setMaterial(
			{ shader: { colorNode: color(0xff0000) } },
			{ disposePrevious: false },
		);

		expect(previous).toEqual([original]);
		expect(box.mesh!.material).not.toBe(original);
		expect(box.getMaterials()).toEqual([box.mesh!.material]);
	});

	it('disposes the replaced material by default', () => {
		const box = createBox({});
		const original = box.mesh!.material as MeshStandardMaterial;
		const dispose = vi.spyOn(original, 'dispose');

		box.setMaterial({ shader: { colorNode: color(0x00ff00) } });

		expect(dispose).toHaveBeenCalledTimes(1);
	});

	it('keeps a material array shape when a mesh has one', () => {
		const box = createBox({});
		const slots = [new MeshStandardMaterial(), new MeshStandardMaterial(), new MeshStandardMaterial()];
		box.mesh!.material = slots;
		box.materials = [...slots];

		box.setMaterial({ shader: { colorNode: color(0x0000ff) } }, { disposePrevious: false });

		const assigned = box.mesh!.material as MeshStandardMaterial[];
		expect(Array.isArray(assigned)).toBe(true);
		expect(assigned).toHaveLength(3);
		expect(new Set(assigned).size).toBe(1);
	});

	it('covers compound meshes too', () => {
		const box = createBox({});
		const extra = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
		box.add(extra);

		box.setMaterial({ shader: { colorNode: color(0xffffff) } }, { disposePrevious: false });

		expect(extra.material).toBe(box.mesh!.material);
	});

	it('returns null for an entity that has nothing to shade', () => {
		const zone = createZone({});
		expect(zone.hasMaterial()).toBe(false);
		expect(zone.setMaterial({ shader: { colorNode: color(0xffffff) } })).toBeNull();
	});

	it('restores previously built materials as the same instances', () => {
		const box = createBox({});
		const original = box.mesh!.material as MeshStandardMaterial;
		box.setMaterial({ shader: { colorNode: color(0xff00ff) } }, { disposePrevious: false });

		const swapped = box.replaceMaterials([original], { disposePrevious: false });

		expect(box.mesh!.material).toBe(original);
		expect(swapped).toHaveLength(1);
		expect(swapped![0]).not.toBe(original);
	});
});

describe('GameEntity behaviors', () => {
	it('finds an enabled behavior by descriptor key', () => {
		const box = createBox({});
		box.use(Thruster, { thrust: 5 });

		expect(box.hasBehavior(Thruster)).toBe(true);
		expect(box.hasBehavior(Wrap)).toBe(false);
		expect(box.getBehaviorRef(Thruster)?.options).toEqual({ thrust: 5 });
	});

	it('reports nothing for an entity that never used a behavior', () => {
		const box = createBox({});

		expect(box.getBehaviorRefs()).toEqual([]);
		expect(box.getBehaviorSlots()).toEqual([]);
		expect(box.getBehaviorHandle(Thruster)).toBeNull();
		expect(box.unuse(Thruster)).toBe(false);
	});

	it('holds one of each behavior: a repeat use() merges options and returns the same handle', () => {
		const box = createBox({});
		const first = box.use(Thruster, { thrust: 1 });
		const second = box.use(Thruster, { thrust: 2 });

		expect(second).toBe(first);
		expect(box.getBehaviorRefs()).toEqual([first.ref]);
		expect(first.getOptions()).toEqual({ thrust: 2 });
	});

	it('a repeat use() switches a disabled behavior back on', () => {
		const box = createBox({});
		const handle = box.use(Thruster);
		handle.disable();

		expect(box.use(Thruster)).toBe(handle);
		expect(handle.enabled).toBe(true);
	});

	it('leaves a disabled behavior out of the refs and hasBehavior, and keeps its handle', () => {
		const box = createBox({});
		const thruster = box.use(Thruster, { thrust: 5 });
		const wrap = box.use(Wrap);

		thruster.disable();

		expect(thruster.enabled).toBe(false);
		expect(box.hasBehavior(Thruster)).toBe(false);
		expect(box.getBehaviorRef(Thruster)).toBeNull();
		expect(box.getBehaviorRefs()).toEqual([wrap.ref]);
		expect(box.getBehaviorHandle(Thruster)).toBe(thruster);

		thruster.enable();

		expect(thruster.enabled).toBe(true);
		// Back in the order the behaviors were declared.
		expect(box.getBehaviorRefs()).toEqual([thruster.ref, wrap.ref]);
		expect(thruster.getOptions()).toEqual({ thrust: 5 });
	});

	it('setOptions merges into the same options object', () => {
		const box = createBox({});
		const handle = box.use(Wrap, { width: 4 });
		const options = handle.getOptions();

		handle.setOptions({ width: 8 });

		expect(handle.getOptions()).toBe(options);
		expect(options).toEqual({ width: 8 });
	});

	it('unuse() drops the behavior, and a later use() starts over', () => {
		const box = createBox({});
		const handle = box.use(Thruster, { thrust: 7 });
		box.use(Wrap);

		expect(box.unuse(Thruster)).toBe(true);

		expect(box.hasBehavior(Thruster)).toBe(false);
		expect(box.hasBehavior(Wrap)).toBe(true);
		expect(box.getBehaviorHandle(Thruster)).toBeNull();
		expect(box.unuse(Thruster)).toBe(false);

		const fresh = box.use(Thruster);
		expect(fresh).not.toBe(handle);
		expect(fresh.getOptions()).toEqual({ thrust: 1 });
	});

	it('a handle stops working once its behavior is removed with unuse()', () => {
		const box = createBox({});
		const handle = box.use(Thruster);
		box.unuse(Thruster);

		expect(handle.enabled).toBe(false);
		expect(() => handle.enable()).toThrow(/removed with unuse\(\)/);
		expect(() => handle.setOptions({ thrust: 2 })).toThrow(/removed with unuse\(\)/);
		expect(() => handle.disable()).not.toThrow();
		expect(box.hasBehavior(Thruster)).toBe(false);
	});
});
