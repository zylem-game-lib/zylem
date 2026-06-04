import {
	WorldBoundary2DFSM,
	type WorldBoundary2DBounds,
	type WorldBoundary2DHits,
} from '@behaviors/behaviors/world-boundary-2d/world-boundary-2d-fsm';
import type { BehaviorHarness, FieldSchema } from './types';

interface Config {
	bounds: WorldBoundary2DBounds;
	probeMoveX: number;
	probeMoveY: number;
}

interface Input {
	position: { x: number; y: number };
}

interface Output {
	state: string;
	lastHits: WorldBoundary2DHits;
	lastPosition: { x: number; y: number } | null;
	lastUpdatedAtMs: number | null;
	movementProbe: {
		input: { moveX: number; moveY: number };
		output: { moveX: number; moveY: number };
	};
}

const configSchema: FieldSchema<Config> = [
	{
		key: 'bounds',
		label: 'bounds',
		kind: { type: 'bounds-ltrb' },
		default: { top: 10, bottom: -10, left: -10, right: 10 },
		help: 'World boundary box (top/bottom are Y, left/right are X).',
	},
	{
		key: 'probeMoveX',
		label: 'getMovement(moveX)',
		kind: { type: 'number' },
		default: 1,
	},
	{
		key: 'probeMoveY',
		label: 'getMovement(moveY)',
		kind: { type: 'number' },
		default: 0,
	},
];

const inputSchema: FieldSchema<Input> = [
	{
		key: 'position',
		label: 'position',
		kind: { type: 'vec2' },
		default: { x: 0, y: 0 },
	},
];

export const worldBoundary2DHarness: BehaviorHarness<Config, Input, Output> = {
	id: 'world-boundary-2d',
	name: 'World Boundary 2D',
	subtitle: 'world-boundary-2d/fsm',
	description:
		'Per-axis hit detection against a fixed world rectangle, with a small movement-constrain probe to show how getMovement zeroes blocked axes.',
	category: 'fsm',
	configSchema,
	inputSchema,
	defaultDelta: 1 / 60,
	create(config) {
		const fsm = new WorldBoundary2DFSM();

		return {
			tick(_delta, input) {
				fsm.update(input.position, config.bounds);
			},
			snapshot(): Output {
				return {
					state: fsm.getState(),
					lastHits: fsm.getLastHits(),
					lastPosition: fsm.getLastPosition(),
					lastUpdatedAtMs: fsm.getLastUpdatedAtMs(),
					movementProbe: {
						input: { moveX: config.probeMoveX, moveY: config.probeMoveY },
						output: fsm.getMovement(config.probeMoveX, config.probeMoveY),
					},
				};
			},
			reset() {
				// Force a fresh evaluation of the current input on next tick by
				// bumping the FSM with an in-bounds position; the harness Apply
				// button is preferred for hard resets.
				fsm.update({ x: 0, y: 0 }, config.bounds);
			},
		};
	},
};
