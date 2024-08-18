import { describe, it } from 'vitest';
import { game } from '../../main';

describe('create a basic game', () => {
  it('default configuration', () => {
    const test = game();
	console.log(test);
  });
});