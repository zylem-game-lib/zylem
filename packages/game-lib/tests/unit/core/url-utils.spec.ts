import { describe, expect, it } from 'vitest';

import {
	getUrlFileExtension,
	resolveAgainstFileUrl,
	stripUrlSearchAndHash,
} from '../../../src/lib/core/loaders/url-utils';

describe('URL asset helpers', () => {
	it('removes search params and hashes before extension parsing', () => {
		expect(
			stripUrlSearchAndHash('/src/assets/enemy-ship-purple.glb?t=1775283135030#debug'),
		).toBe('/src/assets/enemy-ship-purple.glb');
	});

	it('extracts file extensions from Vite-style asset URLs', () => {
		expect(getUrlFileExtension('/src/assets/enemy-ship-purple.glb?t=1775283135030')).toBe('glb');
		expect(getUrlFileExtension('/src/assets/ship.fbx#cache-bust')).toBe('fbx');
		expect(getUrlFileExtension('https://cdn.example.com/model.obj?version=2')).toBe('obj');
	});

	it('returns null when no usable extension exists', () => {
		expect(getUrlFileExtension('/src/assets/ship')).toBeNull();
		expect(getUrlFileExtension('/src/assets/ship.')).toBeNull();
	});

	it('resolves a sibling material library against the model URL', () => {
		expect(resolveAgainstFileUrl('crate.mtl', '/models/crate.obj')).toBe('/models/crate.mtl');
		expect(resolveAgainstFileUrl('crate.mtl', 'https://cdn.example.com/models/crate.obj?v=2')).toBe(
			'https://cdn.example.com/models/crate.mtl',
		);
	});
});
