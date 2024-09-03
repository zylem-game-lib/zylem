import {
	defineSystem,
	defineQuery,
} from 'bitecs'

import { move } from './move';
import { bounce } from './bounce';

export default function createTestSystem() {
	const testQuery = defineQuery([move, bounce])

	return defineSystem((world) => {
		const entities = testQuery(world)
		debugger;
		for (let i = 0; i < entities.length; ++i)
		{
			const id = entities[i]

			if (bounce.height[id] >= -4 && move.movement[id] === 1) {
				bounce.height[id] -= 1;
			} else if (bounce.height[id] < -4 && move.movement[id] === 1) {
				move.movement[id] = 2;
			}
			if (bounce.height[id] <= 4 && move.movement[id] === 2) {
				bounce.height[id] += 1;
			} else if (bounce.height[id] > 4 && move.movement[id] === 2) {
				move.movement[id] = 1;
			}
		}
	
		return world
	})
}