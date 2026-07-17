import { describe, expect, it } from 'vitest';

import { resolveRenderCategory, usesManagedRenderPath, isManagedRenderEntity } from '../../../src/lib/graphics/render-category';

describe('resolveRenderCategory', () => {
	it('defaults to none', () => {
		expect(resolveRenderCategory()).toBe('none');
		expect(resolveRenderCategory({})).toBe('none');
	});

	it('honors explicit category', () => {
		expect(resolveRenderCategory({ category: 'environment' })).toBe('environment');
		expect(resolveRenderCategory({ category: 'pack' })).toBe('pack');
		expect(resolveRenderCategory({ category: 'none' })).toBe('none');
	});
});

describe('usesManagedRenderPath', () => {
	it('returns true for environment and pack', () => {
		expect(usesManagedRenderPath({ category: 'environment' })).toBe(true);
		expect(usesManagedRenderPath({ category: 'pack' })).toBe(true);
	});

	it('returns false for none and default', () => {
		expect(usesManagedRenderPath({ category: 'none' })).toBe(false);
		expect(usesManagedRenderPath()).toBe(false);
	});
});

describe('isManagedRenderEntity', () => {
	it('returns true when instanced or bundled', () => {
		expect(isManagedRenderEntity({ isInstanced: true })).toBe(true);
		expect(isManagedRenderEntity({ isBundled: true })).toBe(true);
	});

	it('returns false otherwise', () => {
		expect(isManagedRenderEntity({})).toBe(false);
		expect(isManagedRenderEntity({ isInstanced: false, isBundled: false })).toBe(false);
	});
});
