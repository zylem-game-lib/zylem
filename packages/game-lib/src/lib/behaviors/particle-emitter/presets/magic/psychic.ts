import {
	createMagicModifier,
	type ParticleMagicModifierOptions,
} from '../../preset-builder';

export function psychic(
	options: Omit<ParticleMagicModifierOptions, 'alignment'> = {},
) {
	return createMagicModifier('psychic', options);
}
