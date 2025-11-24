import { describe, expect, it } from 'vitest';
import { createGame, createStage } from '@zylem/game-lib';

describe('create a basic game', () => {
	it('default configuration', () => {
		const result = createGame();
		expect(result).toMatchSnapshot();
	});
	it('should create a game with multiple stages', async () => {
		const result = createGame(
			createStage(),
			createStage(),
			createStage()
		);
		expect(result.options.length).toEqual(3);
	});
});
