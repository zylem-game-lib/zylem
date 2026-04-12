import { describe, expect, it } from 'vitest';

import {
	getUrlFileExtension,
	stripUrlSearchAndHash,
} from '../../../src/lib/core/loaders/url-utils';

describe('URL asset helpers', () => {
	it('removes search params and hashes before extension parsing', () => {
		expect(
			stripUrlSearchAndHash('/src/assets/cougar-ship.glb?t=1775283135030#debug'),
		).toBe('/src/assets/cougar-ship.glb');
	});

	it('extracts file extensions from Vite-style asset URLs', () => {
		expect(getUrlFileExtension('/src/assets/cougar-ship.glb?t=1775283135030')).toBe('glb');
		expect(getUrlFileExtension('/src/assets/ship.fbx#cache-bust')).toBe('fbx');
		expect(getUrlFileExtension('https://cdn.example.com/model.obj?version=2')).toBe('obj');
	});

	it('returns null when no usable extension exists', () => {
		expect(getUrlFileExtension('/src/assets/ship')).toBeNull();
		expect(getUrlFileExtension('/src/assets/ship.')).toBeNull();
	});
});
