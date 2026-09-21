import { createGame } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';
import {
	useArrowsForAxes,
	useWASDForDirections,
	mergeInputConfigs,
} from '@zylem/game-lib/input';

const player = createSphere();

const input = mergeInputConfigs(
	useArrowsForAxes('p1'),
	useWASDForDirections('p1'),
);

createGame(player).setInputConfiguration(input).start();
