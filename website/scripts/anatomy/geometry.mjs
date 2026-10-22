import * as k from './vendor/iso-kit.mjs';
import { paintOrder, placeParts } from './spatial.ts';
import { STATION_X } from './model.ts';

export function buildGeometry() {
	const width = 1000, height = 510;
	const base = { x: -184, y: -52, w: 478, d: 116, r: 7 };
	const P = k.fitProjection([...k.boxCorners(base, -16, 0), [-151, -32, 78], [284, 45, 45]], width, height, { pad: 65, azimuth: 58, elevation: 30 });
	const parts = [];
	const markup = [];
	const line = (d, tone = 'lo') => k.lineSvg(d, { tone });
	const screws = (plan, z, inset = 3) => k.corners(plan, inset).map(([x, y]) =>
		line(k.ring(x, y, 1.1, z, P, 12)) + k.dotsSvg([k.iso([x, y, z], P)], { size: 0.45 })).join('');
	function slab(id, x, y, z, w, d, h, { tone = 'mid', move, lit = false, detail = '', radius = 0.8 } = {}) {
		const plan = { x, y, w, d, r: radius };
		parts.push({ id, x, y, z, w, d, h, ...(move ? { move } : {}) });
		markup.push(`<g data-part="${id}">${k.solidSvg(k.slabOf(plan, z, h, P, 4, Math.min(0.6, h / 3)), { tone, lit })}${detail}</g>`);
	}
	for (const [index, [x, y]] of k.corners(base, 18).entries()) {
		slab(`foot-${index}`, x - 7, y - 7, -16, 14, 14, 3, { tone: 'lo', radius: 2 });
		slab(`pad-${index}`, x - 5, y - 5, -13, 10, 10, 5, { tone: 'lo' });
	}
	slab('bed', base.x, base.y, -8, base.w, base.d, 8, { tone: 'lo', radius: 7,
		detail: line(k.planOutline(k.insetPlan(base, 5), 0, P), 'faint') + screws(base, 0, 11) });
	for (const y of [-15, 10]) {
		const plan = { x: -169, y, w: 338, d: 5, r: 1 };
		slab(`rail-${y}`, plan.x, y, 0, plan.w, 5, 4, { detail: screws(plan, 4, 1.6) });
	}
	for (const x of [-176, 170]) slab(`stop-${x}`, x, -19, 0, 6, 38, 7, { detail: screws({ x, y: -19, w: 6, d: 38, r: 1 }, 7, 2) });
	const ruler = { x: -165, y: 32, w: 330, d: 8, r: 0.4 };
	const ticks = k.topTicks(-161, 161, 7, 4, 32, 0.8, [2.2, 5], P);
	slab('ruler', ruler.x, ruler.y, 0, ruler.w, ruler.d, 0.8, { tone: 'lo', detail: line(ticks.minor) + line(ticks.major, 'mid') });
	STATION_X.forEach((x, i) => {
		const post = { x: x - 10, y: -36, w: 20, d: 9, r: 1 };
		slab(`column-${i}`, post.x, post.y, 0, 20, 9, 60, { detail: screws(post, 60) });
		slab(`arm-${i}`, x - 11, -36, 60, 22, 28, 8, { detail: screws({ x: x - 11, y: -36, w: 22, d: 28, r: 1 }, 68) });
		slab(`guide-${i}`, x - 8, -8, 45, 16, 3, 23);
		for (const dx of [-8, 4]) slab(`cheek-${i}-${dx}`, x + dx, -5, 45, 4, 10, 23);
		slab(`ram-${i}`, x - 4, -5, 40, 8, 10, 28, { tone: 'hi', move: `punch-${i}` });
		slab(`shoe-${i}`, x - 13, -10, 32, 26, 20, 8, { tone: 'hi', move: `punch-${i}`,
			detail: screws({ x: x - 13, y: -10, w: 26, d: 20, r: 1 }, 40, 3) });
	});
	for (const y of [-15, 10]) slab(`runner-${y}`, -19, y, 4, 38, 5, 3, { move: 'carriage' });
	slab('carriage', -20, -19, 7, 40, 38, 3, { move: 'carriage', detail: screws({ x: -20, y: -19, w: 40, d: 38, r: 1 }, 10) });
	slab('workpiece', -15, -12, 10, 30, 24, 2, { move: 'carriage', lit: true,
		detail: line(k.planOutline({ x: -12, y: -8, w: 24, d: 16, r: 1 }, 12, P), 'faint') +
		STATION_X.map((_, i) => `<path data-stamp="${i}" d="${k.planOutline({ x: -10 + i * 3.6, y: -6, w: 1.8, d: 12, r: 0.4 }, 12, P)}" visibility="hidden"/>`).join('') });
	for (const x of [196, 264]) slab(`inspection-leg-${x}`, x, -20, 0, 10, 54, 20);
	slab('inspection-bed', 190, -24, 20, 90, 62, 5, { detail: screws({ x: 190, y: -24, w: 90, d: 62, r: 2 }, 25, 4) });
	slab('scene-plate', 198, -14, 25, 48, 38, 1, { tone: 'hi', detail:
		line(k.planOutline({ x: 202, y: -10, w: 40, d: 30, r: 1 }, 26, P)) +
		STATION_X.map((_, i) => `<path data-copy d="${k.planOutline({ x: 206 + i * 5.6, y: -6, w: 2.8, d: 20, r: 0.4 }, 26, P)}" visibility="hidden"/>`).join('') });
	// Frame leaves the plate and sliding shutter clear: no hidden intersections.
	slab('aperture-back', 196, -18, 25, 78, 4, 4);
	slab('aperture-front', 196, 24, 25, 78, 4, 4);
	slab('aperture-left', 194, -18, 25, 2, 46, 4);
	slab('aperture-right', 274, -18, 25, 2, 46, 4);
	slab('shutter', 198, -14, 26, 48, 38, 2, { move: 'shutter', detail:
		line(k.planOutline({ x: 202, y: -10, w: 40, d: 30, r: 2 }, 28, P), 'faint') });
	slab('switch-base', -170, 46, 0, 32, 10, 2, { detail: screws({ x: -170, y: 46, w: 32, d: 10, r: 1 }, 2, 2) });
	slab('switch-slot', -163, 48, 2, 18, 6, 0.6, { tone: 'lo' });
	slab('switch-handle', -160, 49, 2.6, 8, 4, 5, { tone: 'hi' });
	slab('nameplate', 202, 46, 0, 67, 10, 0.8, { tone: 'lo', detail:
		k.faceTextSvg(k.topMatrix([235, 53], 0.8, P), 'ZYLEM', { size: 5, tone: 'mid', anchor: 'middle' }) });
	const order = paintOrder(placeParts(parts, STATION_X[0], 0, 0, 0));
	const body = `<path class="iso-halo" d="${k.haloOf(base, -16, 8, P)}"/><g data-assembly>${order.map(i => markup[i].replace('>', `${parts[i].move === 'carriage' ? ` transform="${k.translateAlong(P, [STATION_X[0], 0, 0])}"` : ''}>`)).join('')}</g>`;
	return {
		parts,
		vectors: { x: k.axisVector(P, [1, 0, 0]), z: k.axisVector(P, [0, 0, 1]) },
		svg: k.figureSvg({ width, height, body: [body], label: 'A six-station frame press. One workpiece rides a carriage beneath six stamping heads. A separate inspection shutter keeps drawing the completed scene even when game updates are held.' }),
	};
}
