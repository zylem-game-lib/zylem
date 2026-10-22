import { STATIONS, advance, createState, drawOnce, pose, stepStation, updatesHeld } from './model.ts';
import { paintOrder, placeParts, type Part } from './spatial.ts';

const root = document.querySelector<HTMLElement>('[data-machine]')!;
const config = JSON.parse(document.querySelector('#geometry')!.textContent!) as {
	parts: Part[]; vectors: { x: number[]; z: number[] };
};
const assembly = root.querySelector('[data-assembly]')!;
const nodes = config.parts.map(part => root.querySelector<SVGGElement>(`[data-part="${part.id}"]`)!);
const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-station]')];
const stamps = [...root.querySelectorAll<SVGPathElement>('[data-stamp]')];
const copies = [...root.querySelectorAll<SVGPathElement>('[data-copy]')];
const get = (name: string) => root.querySelector<HTMLElement>(`[data-${name}]`)!;
const play = get('play') as HTMLButtonElement;
const pauseUpdates = get('updates') as HTMLButtonElement;
const still = matchMedia('(prefers-reduced-motion: reduce)');
let state = createState();
let running = !still.matches;
let explicitPlay = false;
let visible = false;
let hovered = false;
let focused = false;
let frame = 0;
let last = 0;
let previousOrder = '';
let speed = 1;

function say(text: string) { get('announcement').textContent = text; }
function text(name: string, value: string) {
	const element = get(name);
	if (element.textContent !== value) element.textContent = value;
}

function render() {
	const { x, stroke, shutter } = pose(state);
	const stamped = state.returning ? STATIONS.length : state.station + (state.progress >= 0.65 ? 1 : 0);
	stamps.forEach((stamp, index) => stamp.setAttribute('visibility', index < stamped ? 'visible' : 'hidden'));
	copies.forEach(copy => copy.setAttribute('visibility', state.drawnRevision > 0 ? 'visible' : 'hidden'));
	config.parts.forEach((part, index) => {
		if (!part.move) return;
		const dx = part.move === 'carriage' ? x : part.move === 'shutter' ? shutter : 0;
		const dz = part.move === `punch-${state.station}` && !state.returning ? -stroke : 0;
		const sx = dx * config.vectors.x[0] + dz * config.vectors.z[0];
		const sy = dx * config.vectors.x[1] + dz * config.vectors.z[1];
		nodes[index].setAttribute('transform', `translate(${sx} ${sy})`);
	});
	const order = paintOrder(placeParts(config.parts, x, state.returning ? -1 : state.station, stroke, shutter));
	const signature = order.join(',');
	if (signature !== previousOrder) {
		const fragment = document.createDocumentFragment();
		for (const index of order) fragment.append(nodes[index]);
		assembly.append(fragment);
		previousOrder = signature;
	}
	const station = STATIONS[state.station];
	text('title', state.returning ? 'Return the carriage' : station.title);
	text('detail', state.returning ? 'The update is complete. The carriage returns with every shoe raised; rendering continues on its own clock.' : station.detail);
	text('call', state.returning ? 'Next game update' : station.call);
	text('layer', state.returning ? 'game-lib' : station.layer);
	text('readout', `Update ${state.updates + 1} · ${state.returning ? 'returning' : `station ${state.station + 1} / ${STATIONS.length}`}`);
	text('revision', String(state.updates));
	text('draw-count', String(state.draws));
	text('drawn-revision', String(state.drawnRevision));
	text('clock-state', updatesHeld(state) ? 'Updates held · drawing independent' : state.pauseUpdates ? 'Finishing current update…' : 'Two independent clocks');
	play.textContent = running ? 'Pause animation' : 'Play animation';
	play.disabled = still.matches;
	text('motion-note', still.matches ? 'Reduced motion: use Step station and Draw once.' : 'Space play/pause · → step · R reset');
	pauseUpdates.textContent = state.pauseUpdates ? 'Resume game updates' : 'Pause game updates';
	pauseUpdates.setAttribute('aria-pressed', String(state.pauseUpdates));
	root.dataset.station = String(state.station);
	root.dataset.updates = String(state.updates);
	root.dataset.draws = String(state.draws);
	root.dataset.running = String(running);
	buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === state.station && !state.returning)));
}

function active() {
	return running && visible && !document.hidden && !still.matches && (explicitPlay || !(hovered || focused));
}
function tick(now: number) {
	frame = 0;
	if (!active()) { last = 0; return; }
	if (last) advance(state, Math.min((now - last) / 1000, 1 / 30) * speed);
	last = now;
	render();
	frame = requestAnimationFrame(tick);
}
function schedule() {
	if (frame) cancelAnimationFrame(frame);
	frame = 0; last = 0;
	if (active()) frame = requestAnimationFrame(tick);
}
function inspect(index?: number) {
	running = false; explicitPlay = false;
	if (index === undefined) stepStation(state);
	else { state.station = index; state.progress = 0.65; state.returning = false; }
	render(); schedule();
	say(state.returning ? 'Update complete. Returning to input.' : `${STATIONS[state.station].title}. ${STATIONS[state.station].detail}`);
}
function toggle() {
	if (still.matches) return;
	running = !running; explicitPlay = running;
	render(); schedule(); say(running ? 'Animation playing.' : 'Animation paused.');
}
function reset() {
	state = createState(); running = false; explicitPlay = false;
	render(); schedule(); say('Reset to the first update.');
}
play.addEventListener('click', toggle);
get('step').addEventListener('click', () => inspect());
get('reset').addEventListener('click', reset);
get('zoom').addEventListener('click', () => {
	const stage = root.querySelector<HTMLElement>('.iso-stage')!;
	const zoomed = stage.dataset.zoomed !== 'true';
	stage.dataset.zoomed = String(zoomed);
	get('zoom').textContent = zoomed ? 'Fit drawing' : 'Zoom drawing';
	get('zoom').setAttribute('aria-pressed', String(zoomed));
	say(zoomed ? 'Drawing enlarged. Scroll horizontally to inspect.' : 'Complete drawing fitted to the card.');
});
get('draw').addEventListener('click', () => { drawOnce(state); render(); say(`Draw ${state.draws}: scene revision ${state.drawnRevision}.`); });
pauseUpdates.addEventListener('click', () => {
	state.pauseUpdates = !state.pauseUpdates;
	explicitPlay = running;
	render(); schedule();
	say(state.pauseUpdates ? 'Game updates will pause at the next update boundary. The renderer continues.' : 'Game updates resumed.');
});
buttons.forEach((button, index) => button.addEventListener('click', () => inspect(index)));
get('speed').addEventListener('change', event => { speed = Number((event.target as HTMLSelectElement).value); });
const themeButton = document.querySelector<HTMLButtonElement>('button[data-theme]')!;
themeButton.addEventListener('click', () => {
	const dark = document.body.dataset.theme !== 'dark';
	document.body.dataset.theme = dark ? 'dark' : 'light';
	themeButton.textContent = dark ? 'Light theme' : 'Dark theme';
});
root.addEventListener('keydown', event => {
	if ((event.target as HTMLElement).closest('button, select, input, a')) return;
	if (event.key === ' ') { event.preventDefault(); toggle(); }
	else if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'n') { event.preventDefault(); inspect(); }
	else if (event.key.toLowerCase() === 'r') reset();
});
root.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') { hovered = true; schedule(); } });
root.addEventListener('pointerleave', () => { hovered = false; schedule(); });
root.addEventListener('focusin', () => { focused = true; schedule(); });
root.addEventListener('focusout', event => { focused = root.contains(event.relatedTarget as Node); schedule(); });
document.addEventListener('visibilitychange', schedule);
still.addEventListener('change', () => { if (still.matches) running = false; render(); schedule(); });
new IntersectionObserver(entries => { visible = entries[entries.length - 1].isIntersecting; schedule(); }).observe(root.querySelector('.iso-stage')!);
window.addEventListener('pagehide', () => { running = false; schedule(); });
render();
