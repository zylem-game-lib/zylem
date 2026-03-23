import {
	createMagicModifier,
	type ParticleMagicModifierOptions,
} from '../../preset-builder';

export function arcane(
	options: Omit<ParticleMagicModifierOptions, 'alignment'> = {},
) {
	return createMagicModifier('arcane', options);
}
