/**
 * The exhibit's level, written as data.
 *
 * Every solid is a convex brush in a `LevelDocument`, the same document the
 * editor saves. `stage.playLevel` builds the meshes and the collision from
 * it and the navmesh bakes from the same solids, so what the agent can walk
 * on and what the route planner thinks is walkable come from one source.
 */
import {
	boxBrush,
	frameForPlane,
	wedgeBrush,
	type BrushSolid,
	type LevelDocument,
} from '@zylem/game-lib/core';

type Point = readonly [x: number, y: number, z: number];

/** Quarter turns that make a `wedgeBrush` on a floor frame rise toward each direction. */
const RISE_TURNS = { '+x': 0, '-z': 1, '-x': 2, '+z': 3 } as const;

/** An axis-aligned block between two corners. */
function block(id: string, min: Point, max: Point): BrushSolid {
	return {
		id,
		planes: boxBrush(
			{ x: min[0], y: min[1], z: min[2] },
			{ x: max[0], y: max[1], z: max[2] },
		),
	};
}

/** A ramp filling the box between two corners, low at `min[1]` and high at `max[1]`. */
function ramp(id: string, min: Point, max: Point, toward: keyof typeof RISE_TURNS): BrushSolid {
	// A floor frame runs `u` along +X and `v` along -Z.
	const frame = frameForPlane({ x: 0, y: 1, z: 0 }, min[1]);
	const planes = wedgeBrush(
		frame,
		{ u0: min[0], u1: max[0], v0: -max[2], v1: -min[2] },
		max[1] - min[1],
		RISE_TURNS[toward],
	);
	if (!planes) throw new Error(`Ramp "${id}" has no volume.`);
	return { id, planes };
}

const DECK_HEIGHT = 3;
const STEP_COUNT = 5;
/** Under the agent's `maxClimb` and the platformer's autostep, so each step is walked, not jumped. */
const STEP_RISE = 0.2;
const STEP_RUN = 1;
/** Where the lowest step starts on the deck. */
const STEPS_START_X = 9;
const TIER_START_X = STEPS_START_X + STEP_COUNT * STEP_RUN;
/** One rise above the top step. */
const TIER_HEIGHT = DECK_HEIGHT + (STEP_COUNT + 1) * STEP_RISE;

/** Steps climbing from the deck toward +X, up to the tier. */
const steps: BrushSolid[] = Array.from({ length: STEP_COUNT }, (_, index) => {
	const x = STEPS_START_X + index * STEP_RUN;
	return block(
		`step-${index + 1}`,
		[x, DECK_HEIGHT, -11],
		[x + STEP_RUN, DECK_HEIGHT + (index + 1) * STEP_RISE, -5],
	);
});

const solids: BrushSolid[] = [
	block('ground', [-22, -1, -16], [22, 0, 16]),

	// A raised deck at the back, reached from the ground by the ramp.
	block('deck', [4, 0, -14], [20, DECK_HEIGHT, -2]),
	ramp('ramp', [-8, 0, -11], [4, DECK_HEIGHT, -5], '+x'),

	// A second tier on the deck, reached by the steps.
	...steps,
	block('tier', [TIER_START_X, DECK_HEIGHT, -14], [20, TIER_HEIGHT, -2]),

	// Walls and pillars to route around.
	block('wall-west', [-14, 0, -2], [-13, 3, 12]),
	block('wall-south', [-6, 0, 5], [8, 3, 6]),
	block('pillar-northwest', [-19, 0, -10], [-17, 4, -8]),
	block('pillar-south', [-2, 0, 10], [0, 4, 12]),
	block('pillar-east', [12, 0, 3], [14, 4, 5]),

	// Nothing leads up here: its top is walkable but cut off, so a click on
	// it gives a partial route that stops at the nearest reachable point.
	block('island', [14, 0, 8], [20, 2, 14]),
];

/** The level the exhibit plays. */
export const level: LevelDocument = {
	version: 2,
	solids,
	doodads: [],
	entities: [],
	navigation: {
		settings: {
			// Wider than the actor's 0.5 capsule, so a route that cuts a corner
			// still leaves the capsule room to pass.
			agentRadius: 0.8,
			agentHeight: 3.8,
			// At or under the platformer's 0.3 autostep.
			maxClimb: 0.3,
			// Under the platformer's 40 degree slide angle.
			maxSlope: 35,
			cellSize: 0.2,
			cellHeight: 0.1,
		},
		excludedSolidIds: [],
		obstacles: [],
		links: [],
	},
};

/** A box around every walkable surface, for the click target. */
export const LEVEL_BOUNDS = {
	center: { x: 0, y: 2, z: 0 },
	size: { x: 44, y: 6, z: 32 },
} as const;

/** Open ground between the ramp and the south wall. */
export const AGENT_SPAWN = { x: -2, y: 0, z: 0 } as const;
