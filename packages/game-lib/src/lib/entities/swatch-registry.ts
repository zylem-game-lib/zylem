/**
 * Runtime registry of swatch sources: the shader factories and behavior
 * descriptors that `entity:apply-swatch` messages can name.
 *
 * A swatch crosses the bridge as `{ kind, source, props }` where `source` is an
 * export name such as `createLava` or `ThrusterBehavior`. game-lib does not
 * depend on `@zylem/shaders`, and behaviors are keyed by symbol rather than
 * string, so this map is how a bare name resolves back to something callable.
 * Hosts fill it at boot (typically by walking the module namespaces they
 * already import, see {@link registerSwatchSourcesFromModule}); game-lib
 * pre-registers its own re-exported behaviors via
 * {@link registerBuiltInBehaviorSwatchSources}.
 *
 * Mirrors `entity-registry.ts`: the factory stays on this side of the bridge
 * and only serializable identifiers cross it.
 */

import type { SwatchKind } from '@zylem/bridge';
import type { BehaviorDescriptor } from '@zylem/behaviors/core';
import type { ZylemShader } from '../graphics/material';

/** A shader factory: turns catalog props into a `ZylemShader`. */
export type SwatchShaderFactory = (props: Record<string, unknown>) => ZylemShader;

export interface ShaderSwatchSource {
	kind: 'shader';
	/** Export name, e.g. `createLava`. */
	id: string;
	create: SwatchShaderFactory;
}

export interface BehaviorSwatchSource {
	kind: 'behavior';
	/** Export name, e.g. `ThrusterBehavior`. */
	id: string;
	descriptor: BehaviorDescriptor<any, any>;
}

export type SwatchSource = ShaderSwatchSource | BehaviorSwatchSource;

type SourceMap = Map<string, SwatchSource>;

const registries: Record<SwatchKind, SourceMap> = {
	shader: new Map(),
	behavior: new Map(),
};
const listeners = new Set<() => void>();

function notify(): void {
	for (const listener of listeners) {
		try {
			listener();
		} catch (error) {
			console.error('[zylem] swatch registry listener failed', error);
		}
	}
}

/**
 * Register one swatch source, replacing any existing source of the same kind
 * and id so a host can override a built-in.
 *
 * @returns An unregister function.
 */
export function registerSwatchSource(source: SwatchSource): () => void {
	registries[source.kind].set(source.id, source);
	notify();
	return () => {
		if (registries[source.kind].get(source.id) === source) {
			registries[source.kind].delete(source.id);
			notify();
		}
	};
}

/** Register several sources at once, notifying listeners only after all of them. */
export function registerSwatchSources(sources: SwatchSource[]): () => void {
	for (const source of sources) {
		registries[source.kind].set(source.id, source);
	}
	notify();
	return () => {
		for (const source of sources) {
			if (registries[source.kind].get(source.id) === source) {
				registries[source.kind].delete(source.id);
			}
		}
		notify();
	};
}

export function getSwatchSource(kind: 'shader', id: string): ShaderSwatchSource | null;
export function getSwatchSource(kind: 'behavior', id: string): BehaviorSwatchSource | null;
export function getSwatchSource(kind: SwatchKind, id: string): SwatchSource | null;
export function getSwatchSource(kind: SwatchKind, id: string): SwatchSource | null {
	return registries[kind].get(id) ?? null;
}

/** Every registered source, shaders first, in registration order. */
export function listSwatchSources(kind?: SwatchKind): SwatchSource[] {
	if (kind) return [...registries[kind].values()];
	return [...registries.shader.values(), ...registries.behavior.values()];
}

/**
 * Observe registry changes.
 *
 * @returns An unsubscribe function.
 */
export function onSwatchRegistryChanged(listener: () => void): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

/** Test hook: drop every registration. */
export function clearSwatchRegistry(): void {
	registries.shader.clear();
	registries.behavior.clear();
	notify();
}

/** Structural check for a `defineBehavior` descriptor. */
export function isBehaviorDescriptor(value: unknown): value is BehaviorDescriptor<any, any> {
	if (typeof value !== 'object' || value === null) return false;
	const candidate = value as Partial<BehaviorDescriptor<any, any>>;
	return (
		typeof candidate.key === 'symbol' &&
		typeof candidate.systemFactory === 'function' &&
		typeof candidate.defaultOptions === 'object' &&
		candidate.defaultOptions !== null
	);
}

/**
 * Register every plausible source found on a module namespace object.
 *
 * - `kind: 'behavior'`: every export that is a behavior descriptor.
 * - `kind: 'shader'`: every function export; with `filter` a host can narrow
 *   this to, say, names starting with `create`.
 *
 * Export names become source ids, which is what makes the live path agree with
 * generated code that imports the same names.
 *
 * @returns An unregister function for everything this call registered.
 */
export function registerSwatchSourcesFromModule(
	kind: SwatchKind,
	module: Record<string, unknown>,
	filter?: (exportName: string, value: unknown) => boolean,
): () => void {
	const sources: SwatchSource[] = [];
	for (const [exportName, value] of Object.entries(module)) {
		if (filter && !filter(exportName, value)) continue;
		if (kind === 'behavior') {
			if (isBehaviorDescriptor(value)) {
				sources.push({ kind, id: exportName, descriptor: value });
			}
		} else if (typeof value === 'function') {
			sources.push({ kind, id: exportName, create: value as SwatchShaderFactory });
		}
	}
	return registerSwatchSources(sources);
}
