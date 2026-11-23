/**
 * Heap measurement for switching behaviors on and off, on demand:
 *
 *   pnpm --filter @zylem/game-lib bench:behavior-toggling
 *
 * It runs a headless stage on the real wasm runtime (the same entity delegate,
 * behavior systems and world step a game uses, with no renderer) and reports
 * how much the JS heap grows in each phase, how many garbage collections the
 * phase triggered, and how long each operation took.
 *
 * Heap growth is `heapUsed` after the phase minus `heapUsed` before it, with a
 * forced collection before the phase and none inside it, so it is the number
 * of bytes the phase allocated as long as the "GCs" column reads 0. "Kept" is
 * the growth that survives a forced collection afterwards.
 *
 * Sizes come from the environment: ZYLEM_HEAP_ENTITIES (default 300),
 * ZYLEM_HEAP_ROUNDS (default 200) and ZYLEM_HEAP_FRAMES (default 30).
 */
import { constants, performance, PerformanceObserver } from 'node:perf_hooks';
import { expect, it } from 'vitest';

import { Ricochet2DBehavior } from '@zylem/behaviors/ricochet-2d';
import { ScreenWrapBehavior } from '@zylem/behaviors/screen-wrap';
import { ThrusterBehavior } from '@zylem/behaviors/thruster';
import { TopDownMovementBehavior } from '@zylem/behaviors/top-down-movement';
import { WorldBoundary2DBehavior } from '@zylem/behaviors/world-boundary-2d';

import { createBox } from '../../src/lib/entities/primitives/box';
import { createRealStage } from '../support/real-stage';

const ENTITIES = Number(process.env.ZYLEM_HEAP_ENTITIES ?? 300);
const ROUNDS = Number(process.env.ZYLEM_HEAP_ROUNDS ?? 200);
/** Frames in the phases that step the simulation. */
const FRAMES = Number(process.env.ZYLEM_HEAP_FRAMES ?? 30);
/** Behaviors on each entity; one swap round toggles every one of them once. */
const BEHAVIORS_PER_ENTITY = 4;
const BOUNDS = { left: -50, right: 50, bottom: -50, top: 50 };

interface Row {
	phase: string;
	ops: number;
	bytes: number;
	kept: number;
	gcs: number;
	ms: number;
}

let unforcedGcs = 0;
const gcObserver = new PerformanceObserver((list) => {
	for (const entry of list.getEntries()) {
		const flags = (entry as any).detail?.flags ?? 0;
		if ((flags & constants.NODE_PERFORMANCE_GC_FLAGS_FORCED) === 0) unforcedGcs++;
	}
});

const collect = (): void => (globalThis as any).gc();
/** GC entries are delivered on a later task; wait for them. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 5));

async function measure(
	rows: Row[],
	phase: string,
	ops: number,
	run: () => void | Promise<void>,
): Promise<void> {
	await settle();
	collect();
	const gcsBefore = unforcedGcs;
	const heapBefore = process.memoryUsage().heapUsed;
	const start = performance.now();
	const pending = run();
	if (pending) await pending;
	const ms = performance.now() - start;
	const bytes = process.memoryUsage().heapUsed - heapBefore;
	await settle();
	const gcs = unforcedGcs - gcsBefore;
	collect();
	const kept = process.memoryUsage().heapUsed - heapBefore;
	rows.push({ phase, ops, bytes, kept, gcs, ms });
}

function formatBytes(bytes: number): string {
	const abs = Math.abs(bytes);
	if (abs >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
	if (abs >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${bytes} B`;
}

function formatTable(rows: Row[]): string {
	const header = ['phase', 'ops', 'heap growth', 'per op', 'kept', 'GCs', 'time', 'per op'];
	const body = rows.map((row) => [
		row.phase,
		String(row.ops),
		formatBytes(row.bytes),
		row.ops > 0 ? `${(row.bytes / row.ops).toFixed(1)} B` : '-',
		formatBytes(row.kept),
		String(row.gcs),
		`${row.ms.toFixed(1)} ms`,
		row.ops > 0 ? `${((row.ms * 1e6) / row.ops).toFixed(0)} ns` : '-',
	]);
	const widths = header.map((title, column) =>
		Math.max(title.length, ...body.map((cells) => cells[column]!.length)),
	);
	const line = (cells: string[]) =>
		cells
			.map((cell, column) => (column === 0 ? cell.padEnd(widths[column]!) : cell.padStart(widths[column]!)))
			.join('  ');
	return [line(header), widths.map((width) => '-'.repeat(width)).join('  '), ...body.map(line)].join('\n');
}

function createShip(index: number) {
	const ship = createBox({
		name: `ship-${index}`,
		position: { x: (index % 20) * 3 - 30, y: Math.floor(index / 20) * 3 - 30, z: 0 },
	});
	return { ship } as {
		ship: ReturnType<typeof createBox>;
		thruster: ReturnType<typeof useThruster>;
		topDown: ReturnType<typeof useTopDown>;
		wrap: ReturnType<typeof useWrap>;
		boundary: ReturnType<typeof useBoundary>;
	};
}

const useThruster = (ship: ReturnType<typeof createBox>) =>
	ship.use(ThrusterBehavior, { linearThrust: 10, angularThrust: 4 });
const useTopDown = (ship: ReturnType<typeof createBox>) =>
	ship.use(TopDownMovementBehavior, { moveSpeed: 6 });
const useWrap = (ship: ReturnType<typeof createBox>) =>
	ship.use(ScreenWrapBehavior, { width: 100, height: 100 });
const useBoundary = (ship: ReturnType<typeof createBox>) =>
	ship.use(WorldBoundary2DBehavior, { boundaries: BOUNDS });

it('reports heap growth for behavior toggling', async () => {
	if (typeof (globalThis as any).gc !== 'function') {
		throw new Error('Needs --expose-gc. Run it with: pnpm --filter @zylem/game-lib bench:behavior-toggling');
	}
	gcObserver.observe({ entryTypes: ['gc'] });
	const rows: Row[] = [];
	const stage = await createRealStage();

	// Control: entities with no behaviors, to tell behavior cost from spawn cost.
	// Laid out on their own plane so nothing overlaps and collides.
	const plain = Array.from({ length: ENTITIES }, (_, i) =>
		createBox({
			name: `plain-${i}`,
			position: { x: (i % 20) * 3 - 30, y: Math.floor(i / 20) * 3 - 30, z: 20 },
		}),
	);
	await measure(rows, 'spawn, no behaviors (control)', ENTITIES, async () => {
		for (const box of plain) await stage.delegate.spawnEntity(box);
	});

	const fleet = Array.from({ length: ENTITIES }, (_, i) => createShip(i));
	await measure(rows, 'first use(): 4 behaviors per entity', ENTITIES * BEHAVIORS_PER_ENTITY, () => {
		for (const entry of fleet) {
			entry.thruster = useThruster(entry.ship);
			entry.topDown = useTopDown(entry.ship);
			entry.wrap = useWrap(entry.ship);
			entry.boundary = useBoundary(entry.ship);
			// Start with thruster and boundary on, the other two off.
			entry.topDown.disable();
			entry.wrap.disable();
		}
	});
	await measure(rows, 'spawn, 2 behaviors on', ENTITIES, async () => {
		for (const { ship } of fleet) await stage.delegate.spawnEntity(ship);
	});
	await measure(rows, 'first frame', 1, () => stage.step());

	/** Swap both pairs on every entity: 4 toggles per entity. */
	const swap = (round: number): void => {
		const odd = round % 2 === 1;
		for (let i = 0; i < fleet.length; i++) {
			const { thruster, topDown, wrap, boundary } = fleet[i]!;
			if (odd) {
				thruster.disable();
				topDown.enable();
				boundary.disable();
				wrap.enable();
			} else {
				topDown.disable();
				thruster.enable();
				wrap.disable();
				boundary.enable();
			}
		}
	};
	const toggles = ENTITIES * BEHAVIORS_PER_ENTITY;

	// The first-use burst: top-down and screen wrap have never run, so
	// enabling them builds their input component and state machine.
	await measure(rows, 'first swap (2 behaviors run for the first time)', toggles, () => swap(1));
	await measure(rows, 'second swap (everything has run once)', toggles, () => swap(2));

	// Let the JIT settle before the steady-state numbers.
	for (let round = 3; round < 43; round++) {
		swap(round);
		stage.step();
	}

	await measure(rows, 'empty phase (measurement floor)', 0, () => {});
	await measure(rows, `steady state: ${ROUNDS} swap rounds`, toggles * ROUNDS, () => {
		for (let round = 0; round < ROUNDS; round++) swap(round + 1);
	});
	// The frame loop allocates on its own. Keep these phases short enough that
	// no collection runs inside them, so the two rows can be compared.
	// The swap + frame row alternates between the two sets of behaviors, so
	// it is compared against frames that run each set without swapping.
	swap(2);
	await measure(rows, `${FRAMES} frames, thruster + boundary on (control)`, FRAMES, () => stage.step(FRAMES));
	swap(1);
	await measure(rows, `${FRAMES} frames, top-down + wrap on (control)`, FRAMES, () => stage.step(FRAMES));
	await measure(rows, `swap round + frame, ${FRAMES} times`, FRAMES, () => {
		for (let round = 0; round < FRAMES; round++) {
			swap(round);
			stage.step();
		}
	});

	// Thruster on again, so setOptions restarts a running behavior.
	swap(2);
	const thrust = { linearThrust: 12 };
	await measure(rows, 'setOptions on a running behavior', ENTITIES * 20, () => {
		for (let n = 0; n < 20; n++) {
			thrust.linearThrust = 12 + n;
			for (let i = 0; i < fleet.length; i++) fleet[i]!.thruster.setOptions(thrust);
		}
	});

	// For comparison: taking a behavior off for good and putting it back.
	await measure(rows, 'unuse() + use() (cold path)', ENTITIES * 20, () => {
		for (let n = 0; n < 20; n++) {
			for (let i = 0; i < fleet.length; i++) {
				const entry = fleet[i]!;
				entry.ship.unuse(ThrusterBehavior);
				entry.thruster = useThruster(entry.ship);
			}
		}
	});
	await measure(rows, 'late use() of a new behavior on a spawned entity', ENTITIES, () => {
		for (let i = 0; i < fleet.length; i++) fleet[i]!.ship.use(Ricochet2DBehavior);
	});

	gcObserver.disconnect();
	stage.destroy();

	console.log(
		[
			'',
			`Behavior toggling heap report: ${ENTITIES} entities, ${ROUNDS} rounds, Node ${process.version}`,
			'',
			formatTable(rows),
			'',
		].join('\n'),
	);
	expect(rows.length).toBeGreaterThan(0);
}, 600_000);
