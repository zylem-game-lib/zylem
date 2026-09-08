import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineBehavior } from '@zylem/behaviors/core';

import {
	clearSwatchRegistry,
	getSwatchSource,
	isBehaviorDescriptor,
	listSwatchSources,
	onSwatchRegistryChanged,
	registerSwatchSource,
	registerSwatchSourcesFromModule,
} from '../../../src/lib/entities/swatch-registry';

const TestBehavior = defineBehavior({
	name: 'swatch-registry-test',
	defaultOptions: { speed: 1 },
	systemFactory: () => ({ update() {} }),
});

describe('swatch registry', () => {
	afterEach(() => {
		clearSwatchRegistry();
	});

	it('resolves a registered shader factory by export name', () => {
		const create = vi.fn(() => ({ colorNode: {} }));
		registerSwatchSource({ kind: 'shader', id: 'createLava', create });

		const source = getSwatchSource('shader', 'createLava');
		expect(source?.create).toBe(create);
		expect(getSwatchSource('behavior', 'createLava')).toBeNull();
	});

	it('keeps shader and behavior namespaces apart', () => {
		registerSwatchSource({ kind: 'shader', id: 'Same', create: () => ({ colorNode: {} }) });
		registerSwatchSource({ kind: 'behavior', id: 'Same', descriptor: TestBehavior });

		expect(getSwatchSource('shader', 'Same')?.kind).toBe('shader');
		expect(getSwatchSource('behavior', 'Same')?.kind).toBe('behavior');
		expect(listSwatchSources()).toHaveLength(2);
	});

	it('lets a later registration override an earlier one, and unregisters cleanly', () => {
		const first = vi.fn();
		const second = vi.fn();
		registerSwatchSource({ kind: 'shader', id: 'createLava', create: first });
		const unregister = registerSwatchSource({ kind: 'shader', id: 'createLava', create: second });

		expect(getSwatchSource('shader', 'createLava')?.create).toBe(second);

		unregister();
		expect(getSwatchSource('shader', 'createLava')).toBeNull();
	});

	it('walks a module namespace, picking descriptors for behaviors and functions for shaders', () => {
		const behaviorModule = {
			TestBehavior,
			SomeType: 'not-a-behavior',
			helper: () => 1,
		};
		const shaderModule = {
			createLava: () => ({ colorNode: {} }),
			createWater: () => ({ colorNode: {} }),
			SOME_CONSTANT: 42,
		};

		registerSwatchSourcesFromModule('behavior', behaviorModule);
		registerSwatchSourcesFromModule('shader', shaderModule, (name) => name.startsWith('create'));

		expect(listSwatchSources('behavior').map((source) => source.id)).toEqual(['TestBehavior']);
		expect(listSwatchSources('shader').map((source) => source.id)).toEqual([
			'createLava',
			'createWater',
		]);
	});

	it('recognizes defineBehavior descriptors structurally', () => {
		expect(isBehaviorDescriptor(TestBehavior)).toBe(true);
		expect(isBehaviorDescriptor({ key: 'string-key', defaultOptions: {} })).toBe(false);
		expect(isBehaviorDescriptor(null)).toBe(false);
	});

	it('notifies listeners on change', () => {
		const listener = vi.fn();
		const stop = onSwatchRegistryChanged(listener);

		registerSwatchSource({ kind: 'behavior', id: 'TestBehavior', descriptor: TestBehavior });
		expect(listener).toHaveBeenCalledTimes(1);

		stop();
		clearSwatchRegistry();
		expect(listener).toHaveBeenCalledTimes(1);
	});
});
