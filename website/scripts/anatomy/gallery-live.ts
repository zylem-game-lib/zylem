import { stopIndex, type Exhibit } from './catalog.ts';
import { paintOrder } from './spatial.ts';
import { galleryPose, type GalleryPart } from './gallery-spatial.ts';

const payload = JSON.parse(document.querySelector('#exhibit-data')!.textContent!) as {
	exhibit: Exhibit;
	parts: GalleryPart[];
	spacing: number;
	vectors: { x: [number, number]; y: [number, number] };
};
const { exhibit, parts, spacing, vectors } = payload;
const element = <T extends Element = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const machine = element('[data-machine]');
const assembly = element<SVGGElement>('[data-assembly]');
const nodes = parts.map(part => element<SVGGElement>(`[data-part="${part.id}"]`));
const choices = [...document.querySelectorAll<HTMLButtonElement>('[data-choice]')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const play = element<HTMLButtonElement>('[data-play]');
let selected = 0, selector = 0;
let drawers: number[] = exhibit.stops.map((_, i) => i === 0 ? 1 : 0);
let touring = !reduced.matches, explicit = false, hovering = false, focused = false, visible = false;
let frame = 0, last = 0, clock = 0, lastOrder = '';

function describe(announce = false) {
	const stop = exhibit.stops[selected];
	machine.dataset.selection = String(selected);
	element('[data-title]').textContent = stop.title;
	element('[data-layer]').textContent = stop.label;
	element('[data-detail]').textContent = stop.detail;
	element('[data-call]').textContent = stop.call;
	element('[data-result]').textContent = stop.result;
	element('[data-readout]').textContent = `${exhibit.name} · ${selected + 1} / ${exhibit.stops.length} · ${stop.title}`;
	element<HTMLAnchorElement>('[data-source]').href = `https://github.com/zylem-game-lib/zylem/blob/d43002a97b55f723bb4ab047088c65b2bd7862cb/${stop.source}`;
	choices.forEach((button, i) => button.setAttribute('aria-pressed', String(i === selected)));
	document.querySelectorAll<SVGGElement>('[data-marker]').forEach(marker => marker.classList.toggle('active-marker', Number(marker.dataset.marker) === selected));
	if (announce) element('[data-announcement]').textContent = `${exhibit.name}: ${stop.title}. ${stop.result}`;
	play.textContent = touring ? 'Pause tour' : 'Play tour';
	play.disabled = reduced.matches;
	element('[data-motion-note]').textContent = reduced.matches ? 'Reduced motion · select a part or step' : 'Space play/pause · ← → inspect · R reset';
}
function draw() {
	const posed = galleryPose(parts, selector, drawers);
	parts.forEach((part, i) => {
		if (part.motion === undefined) return;
		const dx = posed[i].x - part.x, dy = posed[i].y - part.y;
		nodes[i].setAttribute('transform', `translate(${(dx * vectors.x[0] + dy * vectors.y[0]).toFixed(3)} ${(dx * vectors.x[1] + dy * vectors.y[1]).toFixed(3)})`);
	});
	const order = paintOrder(posed), key = order.join(',');
	if (key !== lastOrder) { for (const i of order) assembly.append(nodes[i]); lastOrder = key; }
}
function isMoving() {
	return Math.abs(selector - selected * spacing) > .005 || drawers.some((value, i) => Math.abs(value - (i === selected ? 1 : 0)) > .0001);
}
function tourRuns() { return touring && !reduced.matches && (explicit || (!hovering && !focused)); }
function tick(now: number) {
	frame = 0;
	const dt = last ? Math.min((now - last) / 1000, .05) : 0;
	last = now;
	if (tourRuns()) {
		clock += dt;
		if (clock >= 4.5) { selected = stopIndex(selected + 1, exhibit.stops.length); clock = 0; describe(); }
	}
	const blend = reduced.matches ? 1 : 1 - Math.exp(-dt * 12);
	selector += (selected * spacing - selector) * blend;
	drawers = drawers.map((value, i) => value + ((i === selected ? 1 : 0) - value) * blend);
	if (!isMoving()) { selector = selected * spacing; drawers = drawers.map((_, i) => i === selected ? 1 : 0); }
	draw();
	if (visible && !document.hidden && (isMoving() || tourRuns())) frame = requestAnimationFrame(tick);
}
function run() {
	if (!frame && visible && !document.hidden && (isMoving() || tourRuns())) { last = 0; frame = requestAnimationFrame(tick); }
}
function select(index: number) {
	selected = stopIndex(index, exhibit.stops.length); touring = false; explicit = false; clock = 0;
	if (reduced.matches) { selector = selected * spacing; drawers = drawers.map((_, i) => i === selected ? 1 : 0); draw(); }
	describe(true); run();
}
function toggle() {
	if (reduced.matches) return;
	touring = !touring; explicit = touring; clock = 0; describe(); run();
}
choices.forEach((button, i) => button.addEventListener('click', () => select(i)));
element('[data-next]').addEventListener('click', () => select(selected + 1));
element('[data-previous]').addEventListener('click', () => select(selected - 1));
element('[data-reset]').addEventListener('click', () => select(0));
play.addEventListener('click', toggle);
machine.addEventListener('keydown', event => {
	if (event.target instanceof HTMLButtonElement || event.target instanceof HTMLAnchorElement || event.target instanceof HTMLSelectElement) return;
	if (['ArrowRight', 'ArrowLeft', ' ', 'r', 'R', 'Home', 'End'].includes(event.key)) event.preventDefault();
	if (event.key === 'ArrowRight') select(selected + 1);
	if (event.key === 'ArrowLeft') select(selected - 1);
	if (event.key === 'Home' || event.key.toLowerCase() === 'r') select(0);
	if (event.key === 'End') select(exhibit.stops.length - 1);
	if (event.key === ' ') toggle();
});
element('[data-zoom]').addEventListener('click', () => {
	const stage = element('.iso-stage'), button = element('[data-zoom]');
	const zoom = stage.dataset.zoomed !== 'true';
	stage.dataset.zoomed = String(zoom); button.setAttribute('aria-pressed', String(zoom)); button.textContent = zoom ? 'Fit drawing' : 'Zoom drawing';
});
element('button[data-theme]').addEventListener('click', () => {
	const dark = document.body.dataset.theme !== 'dark';
	document.body.dataset.theme = dark ? 'dark' : 'light';
	element('button[data-theme]').textContent = dark ? 'Light theme' : 'Dark theme';
});
new IntersectionObserver(entries => {
	visible = entries[0].isIntersecting;
	if (!visible) { cancelAnimationFrame(frame); frame = 0; } else run();
}).observe(element('.iso-plate'));
document.addEventListener('visibilitychange', () => {
	if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else run();
});
machine.addEventListener('pointerenter', () => { hovering = true; });
machine.addEventListener('pointerleave', () => { hovering = false; run(); });
machine.addEventListener('focusin', () => { focused = true; });
machine.addEventListener('focusout', event => { focused = machine.contains(event.relatedTarget as Node | null); run(); });
reduced.addEventListener('change', () => { touring = false; explicit = false; select(selected); });
describe(); draw(); run();
