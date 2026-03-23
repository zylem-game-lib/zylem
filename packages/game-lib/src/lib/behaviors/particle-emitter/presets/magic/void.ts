import {
	createMagicModifier,
	type ParticleMagicModifierOptions,
} from '../../preset-builder';

export function voidMagic(
	options: Omit<ParticleMagicModifierOptions, 'alignment'> = {},
) {
	return createMagicModifier('void', options);
}
