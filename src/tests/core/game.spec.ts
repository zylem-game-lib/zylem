import { describe, expect, it } from 'vitest';
import { game, stage } from '../../main';

describe('create a basic game', () => {
	it('default configuration', () => {
		const result = game();
		expect(result).toMatchSnapshot();
	});
	it('should create a game with multiple stages', async () => {
		const result = game(
			stage(),
			stage(),
			stage()
		);
		expect(result.options.length).toEqual(3);
	});
});
