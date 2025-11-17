import { describe, expect, it } from 'vitest';
import { createGame, stage } from '@zylem/game-lib';

describe('create a basic game', () => {
	it('default configuration', () => {
		const result = createGame();
		expect(result).toMatchSnapshot();
	});
	it('should create a game with multiple stages', async () => {
		const result = createGame(
			stage(),
			stage(),
			stage()
		);
		expect(result.options.length).toEqual(3);
	});
});
