import { StageManager, type StageBlueprint } from '@zylem/game-lib/core';

const level1: StageBlueprint = {
	id: 'level-1',
	name: 'Level 1',
	assets: ['/models/props.glb'],
	entities: [
		{
			id: 'player',
			type: 'sphere',
			position: [0, 1],
			data: { radius: 0.5 },
		},
	],
};

/** Register serialized stage data the game can hydrate at runtime. */
export function registerLevel1() {
	StageManager.registerStaticStage(level1.id, level1);
}
