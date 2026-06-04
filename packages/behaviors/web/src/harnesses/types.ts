/**
 * Behavior harness contracts.
 *
 * A harness is a thin adapter around a behavior FSM, store, or action set
 * that lets a SolidJS form drive its inputs and a JSON panel observe its
 * outputs, with no game/scene/world bootstrapping.
 */

export type FieldKind =
	| { type: 'number'; min?: number; max?: number; step?: number }
	| { type: 'boolean' }
	| { type: 'string' }
	| { type: 'vec2' }
	| { type: 'bounds-rect' }
	| { type: 'bounds-ltrb' }
	| { type: 'json' };

export interface FieldDef<TValue = unknown> {
	key: string;
	label: string;
	kind: FieldKind;
	default: TValue;
	help?: string;
}

export type FieldSchema<T> = ReadonlyArray<FieldDef>;

export type HarnessCategory = 'fsm' | 'store' | 'composite' | 'runtime-required';

export interface HarnessAction<I, O> {
	id: string;
	label: string;
	run: (instance: HarnessInstance<I, O>) => void;
}

export interface HarnessInstance<I, O> {
	tick(delta: number, input: I): void;
	snapshot(): O;
	reset(): void;
	/** Optional, behavior-specific imperative methods exposed as buttons. */
	actions?: ReadonlyArray<HarnessAction<I, O>>;
	/**
	 * Optional render hook for fully bespoke harness body content
	 * (e.g. cooldown dynamic row list). Receives the SolidJS scope.
	 * When provided, replaces the default ConfigForm/InputForm panels.
	 */
	customPanel?: () => unknown;
}

export interface BehaviorHarness<
	C extends Record<string, any> = Record<string, any>,
	I extends Record<string, any> = Record<string, any>,
	O extends Record<string, any> = Record<string, any>,
> {
	id: string;
	name: string;
	description?: string;
	category: HarnessCategory;
	/** Path-style label shown in the header, e.g. 'screen-wrap/fsm'. */
	subtitle?: string;
	configSchema: FieldSchema<C>;
	inputSchema: FieldSchema<I>;
	defaultDelta: number;
	create(config: C): HarnessInstance<I, O>;
}

/**
 * Helper to coerce a FieldSchema's defaults into a plain object.
 */
export function defaultsFromSchema<T extends Record<string, any>>(
	schema: FieldSchema<T>,
): T {
	const out: Record<string, unknown> = {};
	for (const field of schema) {
		out[field.key] = structuredClone(field.default);
	}
	return out as T;
}
