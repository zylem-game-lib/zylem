import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { EXHIBITS, stopIndex } from './catalog.ts';
import { buildExhibitGeometry } from './gallery-geometry.mjs';
import { galleryPose } from './gallery-spatial.ts';
import { paintOrder } from './spatial.ts';

for (const exhibit of EXHIBITS) {
	test(`${exhibit.name}: every selection and transition has clear, sortable solids`, () => {
		const { parts, spacing } = buildExhibitGeometry(exhibit);
		assert.ok(parts.length >= 40 && parts.length <= 80);
		assert.equal(new Set(parts.map(part => part.id)).size, parts.length);
		for (let from = 0; from < exhibit.stops.length; from++) for (let to = 0; to < exhibit.stops.length; to++) {
			for (let frame = 0; frame <= 20; frame++) {
				const t = frame / 20;
				const drawers = exhibit.stops.map((_, i) => (i === from ? 1 - t : 0) + (i === to ? t : 0));
				const placed = galleryPose(parts, (from + (to - from) * t) * spacing, drawers);
				assert.equal(new Set(paintOrder(placed)).size, parts.length);
				for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) {
					const a = placed[i], b = placed[j];
					const overlaps = ['x', 'y', 'z'].every((axis, n) => Math.min(a[axis] + a[['w', 'd', 'h'][n]], b[axis] + b[['w', 'd', 'h'][n]]) - Math.max(a[axis], b[axis]) > 1e-7);
					assert.equal(overlaps, false, `${a.id} intersects ${b.id}, ${from} → ${to}, frame ${frame}`);
				}
			}
		}
	});
}

test('captions link to existing source; selection wraps in both directions', () => {
	for (const exhibit of EXHIBITS) {
		assert.equal(stopIndex(-1, exhibit.stops.length), exhibit.stops.length - 1);
		assert.equal(stopIndex(exhibit.stops.length, exhibit.stops.length), 0);
		for (const stop of exhibit.stops) assert.ok(readFileSync(new URL(`../../../${stop.source}`, import.meta.url), 'utf8').length);
	}
});
