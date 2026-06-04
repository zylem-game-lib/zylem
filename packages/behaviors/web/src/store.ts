import { proxy, ref, subscribe } from 'valtio/vanilla';
import { createSignal, onCleanup, onMount } from 'solid-js';
import type { BehaviorHarness, HarnessInstance } from './harnesses/types';
import { defaultsFromSchema } from './harnesses/types';
import { registry } from './harnesses/registry';

/**
 * Deep clone via JSON. We can't use `structuredClone` here because valtio v2
 * proxies trip its internal "is the slot a known type" check and throw
 * `DataCloneError`, even when the underlying values are plain JSON. All
 * harness configs and inputs are JSON-serializable by contract, so this is
 * safe.
 */
function plainClone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value));
}

export interface HistoryEntry {
	tick: number;
	time: number;
	delta: number;
	state: string | null;
	snapshot: unknown;
}

export interface HarnessRuntimeState {
	selectedId: string;
	config: Record<string, unknown>;
	input: Record<string, unknown>;
	delta: number;
	tickCount: number;
	timeElapsed: number;
	historyEnabled: boolean;
	historyLimit: number;
	history: HistoryEntry[];
	snapshotRevision: number;
	currentInstance: HarnessInstance<any, any> | null;
}

const firstHarness = registry.find((h) => h.category !== 'runtime-required') ?? registry[0]!;

export const state: HarnessRuntimeState = proxy<HarnessRuntimeState>({
	selectedId: firstHarness.id,
	config: defaultsFromSchema(firstHarness.configSchema),
	input: defaultsFromSchema(firstHarness.inputSchema),
	delta: firstHarness.defaultDelta,
	tickCount: 0,
	timeElapsed: 0,
	historyEnabled: true,
	historyLimit: 50,
	history: [],
	snapshotRevision: 0,
	currentInstance: ref(firstHarness.create(defaultsFromSchema(firstHarness.configSchema))),
});

function findHarness(id: string): BehaviorHarness | undefined {
	return registry.find((h) => h.id === id);
}

export function getCurrentHarness(): BehaviorHarness | undefined {
	return findHarness(state.selectedId);
}

export function selectHarness(id: string): void {
	const h = findHarness(id);
	if (!h || h.category === 'runtime-required') return;
	state.selectedId = id;
	state.config = defaultsFromSchema(h.configSchema);
	state.input = defaultsFromSchema(h.inputSchema);
	state.delta = h.defaultDelta;
	state.tickCount = 0;
	state.timeElapsed = 0;
	state.history = [];
	state.snapshotRevision = 0;
	state.currentInstance = ref(h.create(state.config));
}

export function applyConfig(): void {
	const h = getCurrentHarness();
	if (!h) return;
	state.tickCount = 0;
	state.timeElapsed = 0;
	state.history = [];
	state.snapshotRevision = 0;
	state.currentInstance = ref(h.create(plainClone(state.config)));
}

export function resetInstance(): void {
	const inst = state.currentInstance;
	if (!inst) return;
	inst.reset();
	state.tickCount = 0;
	state.timeElapsed = 0;
	state.history = [];
	state.snapshotRevision++;
}

function pushHistory(delta: number): void {
	if (!state.historyEnabled) return;
	const inst = state.currentInstance;
	if (!inst) return;
	const snap = inst.snapshot() as Record<string, unknown>;
	const entry: HistoryEntry = {
		tick: state.tickCount,
		time: state.timeElapsed,
		delta,
		state:
			typeof snap?.['state'] === 'string'
				? (snap['state'] as string)
				: null,
		snapshot: snap,
	};
	state.history.push(entry);
	if (state.history.length > state.historyLimit) {
		state.history.splice(0, state.history.length - state.historyLimit);
	}
}

export function tickOnce(deltaOverride?: number): void {
	const inst = state.currentInstance;
	if (!inst) return;
	const delta = deltaOverride ?? state.delta;
	inst.tick(delta, plainClone(state.input));
	state.tickCount++;
	state.timeElapsed += delta;
	state.snapshotRevision++;
	pushHistory(delta);
}

export function tickMany(n: number): void {
	for (let i = 0; i < n; i++) tickOnce();
}

/**
 * Write a single input field and immediately advance one tick so the
 * snapshot reflects the new input. This is what makes the harness feel
 * "live" — edit a position component, see the FSM transition.
 */
export function setInputField(key: string, value: unknown): void {
	state.input = { ...state.input, [key]: value };
	tickOnce();
}

/**
 * Replace the entire input object (e.g. reset to defaults) and tick once.
 */
export function setInput(next: Record<string, unknown>): void {
	state.input = next;
	tickOnce();
}

export function runAction(id: string): void {
	const inst = state.currentInstance;
	if (!inst?.actions) return;
	const action = inst.actions.find((a) => a.id === id);
	if (!action) return;
	action.run(inst);
	state.snapshotRevision++;
}

/**
 * Solid hook: returns a signal that bumps whenever the store changes.
 * Caller can call `revision()` inside any reactive scope to subscribe.
 */
export function useStoreSignal() {
	const [revision, setRevision] = createSignal(0);
	let unsub: (() => void) | null = null;
	onMount(() => {
		unsub = subscribe(state, () => setRevision((r) => r + 1));
	});
	onCleanup(() => {
		unsub?.();
		unsub = null;
	});
	return revision;
}
