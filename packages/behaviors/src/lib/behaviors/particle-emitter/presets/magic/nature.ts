import {
	createMagicModifier,
	type ParticleMagicModifierOptions,
} from '../../preset-builder';

export function nature(
	options: Omit<ParticleMagicModifierOptions, 'alignment'> = {},
) {
	return createMagicModifier('nature', options);
}
