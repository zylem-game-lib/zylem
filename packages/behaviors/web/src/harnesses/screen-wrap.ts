import { ScreenWrapFSM } from '@behaviors/behaviors/screen-wrap/screen-wrap-fsm';
import { createBounds2DRect, wrapPoint2D } from '@behaviors/behaviors/shared/bounds-2d';
import type { BehaviorHarness, FieldSchema } from './types';

interface Config {
	width: number;
	height: number;
	centerX: number;
	centerY: number;
	edgeThreshold: number;
}

interface Input {
	position: { x: number; y: number };
	autoWrap: boolean;
	manualWrapped: boolean;
}

interface Output {
	state: string;
	position: { x: number; y: number };
	bounds: { minX: number; maxX: number; minY: number; maxY: number };
	wrappedThisTick: boolean;
	autoWrap: boolean;
}

const configSchema: FieldSchema<Config> = [
	{ key: 'width', label: 'width', kind: { type: 'number' }, default: 20 },
	{ key: 'height', label: 'height', kind: { type: 'number' }, default: 15 },
	{ key: 'centerX', label: 'centerX', kind: { type: 'number' }, default: 0 },
	{ key: 'centerY', label: 'centerY', kind: { type: 'number' }, default: 0 },
	{
		key: 'edgeThreshold',
		label: 'edgeThreshold',
		kind: { type: 'number' },
		default: 2,
		help: 'Distance from edge that triggers NearEdge* states.',
	},
];

const inputSchema: FieldSchema<Input> = [
	{
		key: 'position',
		label: 'position',
		kind: { type: 'vec2' },
		default: { x: 0, y: 0 },
	},
	{
		key: 'autoWrap',
		label: 'autoWrap',
		kind: { type: 'boolean' },
		default: true,
		help: 'When true the harness applies wrapPoint2D before feeding the FSM, matching the real system.',
	},
	{
		key: 'manualWrapped',
		label: 'manualWrapped (if !autoWrap)',
		kind: { type: 'boolean' },
		default: false,
	},
];

export const screenWrapHarness: BehaviorHarness<Config, Input, Output> = {
	id: 'screen-wrap',
	name: 'Screen Wrap',
	subtitle: 'screen-wrap/fsm',
	description:
		'Asteroids-style screen wrap edge detection. The FSM tracks whether the entity is in the center, near an edge, or just wrapped. Feed positions over time to see transitions.',
	category: 'fsm',
	configSchema,
	inputSchema,
	defaultDelta: 1 / 60,
	create(config) {
		const fsm = new ScreenWrapFSM();
		let lastInput: Input | null = null;
		let lastWrapped = false;
		let lastEffectivePos = { x: 0, y: 0 };

		const boundsFromConfig = () => createBounds2DRect(config);

		return {
			tick(_delta, input) {
				lastInput = input;
				const bounds = boundsFromConfig();
				let pos = { x: input.position.x, y: input.position.y };
				let wrapped = false;

				if (input.autoWrap) {
					const result = wrapPoint2D(pos, bounds);
					wrapped = result.wrapped;
					pos = { x: result.x, y: result.y };
				} else {
					wrapped = input.manualWrapped;
				}

				lastEffectivePos = pos;
				lastWrapped = wrapped;

				fsm.update(pos, {
					minX: bounds.minX,
					maxX: bounds.maxX,
					minY: bounds.minY,
					maxY: bounds.maxY,
					edgeThreshold: config.edgeThreshold,
				}, wrapped);
			},
			snapshot(): Output {
				const bounds = boundsFromConfig();
				return {
					state: fsm.getState(),
					position: lastEffectivePos,
					bounds: {
						minX: bounds.minX,
						maxX: bounds.maxX,
						minY: bounds.minY,
						maxY: bounds.maxY,
					},
					wrappedThisTick: lastWrapped,
					autoWrap: lastInput?.autoWrap ?? true,
				};
			},
			reset() {
				lastInput = null;
				lastWrapped = false;
				lastEffectivePos = { x: 0, y: 0 };
				// FSM has no public reset; rebuild via Apply.
			},
		};
	},
};
