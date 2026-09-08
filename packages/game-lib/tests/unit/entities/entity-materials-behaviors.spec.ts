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

describe('GameEntity behavior refs', () => {
	it('finds an attached behavior by descriptor key', () => {
		const box = createBox({});
		box.use(Thruster, { thrust: 5 });

		expect(box.hasBehavior(Thruster)).toBe(true);
		expect(box.hasBehavior(Wrap)).toBe(false);
		expect(box.getBehaviorRef(Thruster)?.options).toEqual({ thrust: 5 });
	});

	it('removes by descriptor and returns the ref that was attached', () => {
		const box = createBox({});
		const handle = box.use(Thruster, { thrust: 5 });
		box.use(Wrap);

		const removed = box.removeBehavior(Thruster);

		expect(removed).toBe(handle.ref);
		expect(box.hasBehavior(Thruster)).toBe(false);
		expect(box.hasBehavior(Wrap)).toBe(true);
		expect(box.removeBehavior(Thruster)).toBeNull();
	});

	it('removes by exact ref when duplicates of the same key exist', () => {
		const box = createBox({});
		const first = box.use(Thruster, { thrust: 1 });
		const second = box.use(Thruster, { thrust: 2 });

		box.removeBehavior(second.ref);

		expect(box.getBehaviorRefs()).toEqual([first.ref]);
	});

	it('restores a removed ref as the same object without duplicating it', () => {
		const box = createBox({});
		const handle = box.use(Thruster, { thrust: 7 });
		box.removeBehavior(Thruster);

		box.restoreBehaviorRef(handle.ref);
		box.restoreBehaviorRef(handle.ref);

		expect(box.getBehaviorRefs()).toEqual([handle.ref]);
		expect(box.getBehaviorRef(Thruster)?.options).toEqual({ thrust: 7 });
	});
});
