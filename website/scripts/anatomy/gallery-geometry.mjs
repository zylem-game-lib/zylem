import * as k from './vendor/iso-kit.mjs';
import { paintOrder } from './spatial.ts';
import { galleryPose } from './gallery-spatial.ts';

/** Four mechanically distinct benches, sharing only their hardware vocabulary. */
export function buildExhibitGeometry(exhibit) {
	const cabinet = exhibit.id === 'config';
	const width = 1000, height = 510;
	const base = cabinet ? { x: -120, y: -62, w: 210, d: 165, r: 7 } : { x: -166, y: -62, w: 332, d: 165, r: 7 };
	const P = k.fitProjection([...k.boxCorners(base, -16, cabinet ? 108 : 65)], width, height, { pad: 52, azimuth: 50, elevation: 32 });
	const parts = [], markup = [];
	const line = (d, tone = 'lo') => k.lineSvg(d, { tone });
	const screws = (plan, z, inset = 3) => k.corners(plan, inset).map(([x, y]) => line(k.ring(x, y, .9, z, P, 12)) + k.dotsSvg([k.iso([x, y, z], P)], { size: .4 })).join('');
	function slab(id, x, y, z, w, d, h, options = {}) {
		const { tone = 'mid', motion, lit = false, detail = '', engraved = false, radius = .8, marker, seams = [] } = options;
		const plan = { x, y, w, d, r: radius };
		parts.push({ id, x, y, z, w, d, h, ...(motion !== undefined ? { motion } : {}) });
		markup.push(`<g data-part="${id}"${marker !== undefined ? ` data-marker="${marker}"` : ''}>${k.solidSvg(k.slabOf(plan, z, h, P, 4, Math.min(.6, h / 3)), { tone, lit, inner: seams.map(height => line(k.sideSeam(plan, height, P, 4), 'faint')).join('') })}${engraved ? screws(plan, z + h) + line(k.planOutline(k.insetPlan(plan, 4), z + h, P), 'faint') : ''}${detail}</g>`);
	}
	for (const [i, [x, y]] of k.corners(base, 17).entries()) {
		slab(`foot-${i}`, x - 7, y - 7, -16, 14, 14, 3, { tone: 'lo', radius: 2 });
		slab(`pad-${i}`, x - 5, y - 5, -13, 10, 10, 5, { tone: 'lo' });
	}
	slab('base', base.x, base.y, -8, base.w, base.d, 8, { tone: 'lo', engraved: true, radius: 7 });
	const nameX = base.x + base.w - 72;
	slab('nameplate', nameX, 85, 0, 58, 9, .8, { tone: 'lo', detail: k.faceTextSvg(k.topMatrix([nameX + 29, 91], .8, P), 'ZYLEM', { size: 4.5, tone: 'mid', anchor: 'middle' }) });
	const count = exhibit.stops.length;
	const spacing = count === 6 ? 48 : 56;
	const start = -(count - 1) * spacing / 2;
	if (cabinet) {
		// Every drawer stays supported by its two full-length runners during travel.
		for (const x of [-108, 32]) for (const y of [-48, 65]) slab(`post-${x}-${y}`, x, y, 0, 8, 8, 102, { tone: 'mid' });
		for (const x of [-108, 32]) slab(`cap-side-${x}`, x, -48, 102, 8, 121, 4);
		for (const y of [-48, 65]) slab(`cap-cross-${y}`, -100, y, 102, 132, 8, 4);
		for (let i = 0; i < count; i++) {
			const z = 6 + i * 23;
			for (const y of [-48, 69]) slab(`crossbar-${i}-${y}`, -100, y, z - 4, 132, 4, 2);
			for (const x of [-96, 18]) slab(`runner-${i}-${x}`, x, -48, z - 2, 6, 121, 2);
			const opts = { motion: i };
			slab(`drawer-${i}`, -96, -40, z, 120, 50, 3, { ...opts, engraved: true });
			slab(`back-${i}`, -96, -40, z + 3, 120, 3, 12, opts);
			slab(`left-${i}`, -96, -37, z + 3, 3, 44, 12, opts);
			slab(`right-${i}`, 21, -37, z + 3, 3, 44, 12, opts);
			slab(`front-${i}`, -96, 7, z + 3, 120, 3, 12, opts);
			for (const x of [-60, -24]) slab(`pull-mount-${i}-${x}`, x, 10, z + 6, 4, 7, 4, opts);
			slab(`pull-${i}`, -60, 17, z + 6, 40, 3, 4, { ...opts, tone: 'hi', marker: i });
			slab(`card-${i}`, -78, -28, z + 3, 80, 25, 1, { ...opts, tone: 'hi', detail: line(k.planOutline({ x: -73, y: -24, w: 70, d: 17, r: .5 }, z + 4, P)) });
			slab(`indicator-${i}`, 5, 10, z + 6, 10, 2, 4, { ...opts, tone: 'lo' });
		}
	} else {
		// A real sliding inspector runs on two rails in front of the stationary specimens.
		for (const y of [43, 64]) slab(`rail-${y}`, -151, y, 0, 302, 4, 4, { tone: 'mid' });
		for (const x of [-158, 151]) slab(`stop-${x}`, x, 40, 0, 7, 31, 8, { engraved: true });
		for (const y of [43, 64]) slab(`shoe-${y}`, start - 18, y, 4, 36, 4, 3, { motion: 'selector' });
		slab('selector', start - 20, 40, 7, 40, 31, 3, { motion: 'selector', engraved: true });
		slab('selector-index', start - 8, 43, 10, 16, 20, 2, { motion: 'selector', lit: true, detail: line(k.planOutline({ x: start - 5, y: 46, w: 10, d: 14, r: .4 }, 12, P), 'faint') });
		const ticks = k.topTicks(-148, 148, 4, 5, 77, .8, [2, 5], P);
		slab('ruler', -151, 77, 0, 302, 7, .8, { tone: 'lo', detail: line(ticks.minor) + line(ticks.major, 'mid') });
		for (let i = 0; i < count; i++) {
			const x = start + i * spacing;
			if (exhibit.id === 'game') {
				slab(`socket-${i}`, x - 22, -43, 0, 44, 69, 4, { engraved: true });
				slab(`module-${i}`, x - 18, -35, 4, 36, 44, 44, { tone: 'mid', seams: [12, 40] });
				slab(`lid-${i}`, x - 18, -35, 48, 36, 44, 2, { tone: 'hi', engraved: true, detail: Array.from({ length: 4 }, (_, slot) => line(k.planOutline({ x: x - 11, y: -26 + slot * 7, w: 22, d: 2, r: .8 }, 50, P), 'faint')).join('') });
				for (const dx of [-9, 5]) slab(`terminal-${i}-${dx}`, x + dx, -39, 4, 4, 4, 8);
				slab(`switch-seat-${i}`, x - 9, 12, 4, 18, 10, 2, { tone: 'lo' });
				slab(`switch-${i}`, x - 4, 14, 6, 8, 6, 7, { tone: 'hi' });
			} else {
				// Four short stand-offs carry each sample tray clear of the base.
				for (const dx of [-17, 13]) for (const y of [-32, 12]) slab(`mount-${i}-${dx}-${y}`, x + dx, y, 0, 4, 4, 9);
				slab(`tray-${i}`, x - 21, -36, 9, 42, 56, 3, { engraved: true, tone: 'hi' });
				if (exhibit.id === 'stage') stageSpecimen(i, x);
				else entitySpecimen(i, x);
			}
		}
	}
	function stageSpecimen(i, x) {
		if (i === 0) {
			slab('camera-foot', x - 10, -18, 12, 20, 20, 3, { engraved: true });
			slab('camera-post', x - 3, -12, 15, 6, 6, 19);
			slab('camera-body', x - 13, -22, 34, 26, 22, 17, { engraved: true });
			slab('camera-lens', x - 8, 0, 38, 16, 8, 10, { tone: 'hi' });
		} else if (i === 1) {
			slab('scene-floor', x - 16, -28, 12, 32, 38, 2, { engraved: true });
			slab('scene-block-a', x - 12, -22, 14, 12, 12, 12);
			slab('scene-block-b', x + 3, -7, 14, 10, 13, 24, { tone: 'hi' });
		} else if (i === 2) {
			for (let j = 0; j < 4; j++) slab(`simulation-layer-${j}`, x - 16, -25, 12 + j * 6, 32, 30, 6, { tone: j % 2 ? 'hi' : 'mid', engraved: j === 3 });
		} else if (i === 3) {
			for (let j = 0; j < 4; j++) slab(`entity-block-${j}`, x - 15 + (j % 2) * 17, -25 + Math.floor(j / 2) * 20, 12, 13, 15, 12 + j * 3, { engraved: true });
		} else {
			// An empty, open receiving tray represents released resources.
			slab('cleanup-bottom', x - 16, -28, 12, 32, 36, 2);
			for (const dx of [-16, 13]) slab(`cleanup-side-${dx}`, x + dx, -28, 14, 3, 36, 17);
			slab('cleanup-back', x - 13, -28, 14, 26, 3, 17);
		}
	}
	function entitySpecimen(i, x) {
		if (i === 0) {
			for (const dx of [-9, 3]) slab(`actor-leg-${dx}`, x + dx, -11, 12, 6, 10, 14);
			slab('actor-body', x - 10, -12, 26, 20, 12, 20, { engraved: true });
			slab('actor-head', x - 6, -10, 46, 12, 10, 10, { tone: 'hi' });
			for (const dx of [-15, 10]) slab(`actor-arm-${dx}`, x + dx, -12, 29, 5, 12, 14);
		} else if (i === 1) {
			slab('sheet', x - 16, -27, 12, 32, 37, 2, { engraved: true });
			for (let j = 0; j < 4; j++) slab(`sprite-frame-${j}`, x - 12 + (j % 2) * 13, -22 + Math.floor(j / 2) * 16, 14, 10, 12, 1, { tone: j === 1 ? 'hi' : 'lo' });
		} else if (i === 2) {
			slab('shape-lower', x - 13, -20, 12, 26, 26, 12, { engraved: true });
			slab('shape-upper', x - 8, -15, 24, 16, 16, 12, { tone: 'hi', engraved: true });
		} else if (i === 3) {
			for (let j = 0; j < 3; j++) slab(`text-type-${j}`, x - 15, -27 + j * 12, 12, 30 - j * 4, 8, 8, { tone: 'hi' });
		} else if (i === 4) {
			for (const dx of [-16, 13]) slab(`sensor-side-${dx}`, x + dx, -27, 12, 3, 34, 19);
			for (const y of [-27, 4]) slab(`sensor-edge-${y}`, x - 13, y, 12, 26, 3, 19);
		} else {
			for (let j = 0; j < 5; j++) slab(`level-entry-${j}`, x - 16 + (j % 2) * 18, -29 + Math.floor(j / 2) * 14, 12, 14, 10, 5 + (j % 3) * 5, { tone: 'hi' });
		}
	}
	const posed = galleryPose(parts, 0, cabinet ? [1, 0, 0, 0] : []);
	const body = `<path class="iso-halo" d="${k.haloOf(base, -16, 8, P)}"/><g data-assembly>${paintOrder(posed).map(i => {
		const dy = posed[i].y - parts[i].y;
		return markup[i].replace('>', ` transform="${k.translateAlong(P, [0, dy, 0])}">`);
	}).join('')}</g>`;
	return { parts, spacing, vectors: { x: k.axisVector(P, [1, 0, 0]), y: k.axisVector(P, [0, 1, 0]) }, svg: k.figureSvg({ width, height, body: [body], label: `${exhibit.title}. ${exhibit.intro}` }) };
}
