import {
	createMagicModifier,
	type ParticleMagicModifierOptions,
} from '../../preset-builder';

export function corrupted(
	options: Omit<ParticleMagicModifierOptions, 'alignment'> = {},
) {
	return createMagicModifier('corrupted', options);
}
