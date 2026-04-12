import { describe, expect, it } from 'vitest';

import {
	readRenderSlot,
	readSummary,
	writeInputSlot,
	writeInputSlotFromParts,
	ZYLEM_RUNTIME_INPUT_STRIDE,
	ZYLEM_RUNTIME_RENDER_STRIDE,
	ZYLEM_RUNTIME_SUMMARY_LEN,
} from '../../../src/lib/runtime/zylem-wasm-runtime';

describe('zylem-wasm-runtime buffer helpers', () => {
	it('writeInputSlot writes contiguous slot data', () => {
		const view = new Float32Array(18);
		const stride = ZYLEM_RUNTIME_INPUT_STRIDE;
		writeInputSlot(view, stride, 0, [1, 2, 3, 0, 0, 0, 1, 0, 5]);
		writeInputSlot(view, stride, 1, [9, 8, 7, 1, 0, 0, 0, 2, 3]);
		expect(view[0]).toBe(1);
		expect(view[stride + 0]).toBe(9);
		expect(view[stride + 7]).toBe(2);
	});

	it('writeInputSlotFromParts matches packed layout', () => {
		const view = new Float32Array(ZYLEM_RUNTIME_INPUT_STRIDE);
		writeInputSlotFromParts(view, ZYLEM_RUNTIME_INPUT_STRIDE, 0, {
			position: [1, 2, 3],
			rotation: [0, 0, 0, 1],
			contacts: 2,
			speed: 4,
		});
		expect(Array.from(view)).toEqual([1, 2, 3, 0, 0, 0, 1, 2, 4]);
	});

	it('readRenderSlot reads 12 floats per slot', () => {
		const stride = ZYLEM_RUNTIME_RENDER_STRIDE;
		const view = new Float32Array(stride * 2);
		view.set([1, 2, 3, 0, 0, 0, 1, 0.5, 2, 0.9, 3.5, 0], 0);
		const a = readRenderSlot(view, stride, 0);
		expect(a.position).toEqual([1, 2, 3]);
		expect(a.rotation).toEqual([0, 0, 0, 1]);
		expect(a.scaleMultiplier).toBe(0.5);
		expect(a.contactCount).toBe(2);
		expect(a.heat).toBeCloseTo(0.9);
		expect(a.speed).toBeCloseTo(3.5);
	});

	it('readSummary maps summary buffer', () => {
		const view = new Float32Array(ZYLEM_RUNTIME_SUMMARY_LEN);
		view.set([10, 3, 24, 0.5, 1, 8]);
		const s = readSummary(view);
		expect(s.entityCount).toBe(10);
		expect(s.collidingEntities).toBe(3);
		expect(s.totalContacts).toBe(24);
		expect(s.averageHeat).toBe(0.5);
		expect(s.maxHeat).toBe(1);
		expect(s.maxContacts).toBe(8);
	});
});
