import { UpdateContext } from "../core/base-node-life-cycle";

/**
 * Listen for a single global key change inside an onUpdate pipeline.
 * Usage: onUpdate(globalChange('p1Score', (value) => { ... }))
 */
export function globalChange<T = any>(
	key: string,
	callback: (value: T, ctx: UpdateContext<any>) => void
) {
	let previousValue: T | undefined = undefined;
	return (ctx: UpdateContext<any>) => {
		const currentValue = ctx.globals?.[key] as T;
		if (previousValue !== currentValue) {
			// Ignore the very first undefined->value transition only if both are undefined
			if (!(previousValue === undefined && currentValue === undefined)) {
				callback(currentValue, ctx);
			}
			previousValue = currentValue;
		}
	};
}

/**
 * Listen for multiple global key changes inside an onUpdate pipeline.
 * Calls back when any of the provided keys changes.
 * Usage: onUpdate(globalChanges(['p1Score','p2Score'], ([p1,p2]) => { ... }))
 */
export function globalChanges<T = any>(
	keys: string[],
	callback: (values: T[], ctx: UpdateContext<any>) => void
) {
	let previousValues: (T | undefined)[] = new Array(keys.length).fill(undefined);
	return (ctx: UpdateContext<any>) => {
		const currentValues = keys.map((k) => ctx.globals?.[k] as T);
		const hasAnyChange = currentValues.some((val, idx) => previousValues[idx] !== val);
		if (hasAnyChange) {
			// Ignore initial all-undefined state
			const allPrevUndef = previousValues.every((v) => v === undefined);
			const allCurrUndef = currentValues.every((v) => v === undefined);
			if (!(allPrevUndef && allCurrUndef)) {
				callback(currentValues as T[], ctx);
			}
			previousValues = currentValues;
		}
	};
}


/**
 * Listen for a single stage variable change inside an onUpdate pipeline.
 * Usage: onUpdate(variableChange('score', (value, ctx) => { ... }))
 */
export function variableChange<T = any>(
	key: string,
	callback: (value: T, ctx: UpdateContext<any>) => void
) {
	let previousValue: T | undefined = undefined;
	return (ctx: UpdateContext<any>) => {
		// @ts-ignore - stage is optional on UpdateContext
		const currentValue = (ctx.stage?.getVariable?.(key) ?? undefined) as T;
		if (previousValue !== currentValue) {
			if (!(previousValue === undefined && currentValue === undefined)) {
				callback(currentValue, ctx);
			}
			previousValue = currentValue;
		}
	};
}

/**
 * Listen for multiple stage variable changes; fires when any changes.
 * Usage: onUpdate(variableChanges(['a','b'], ([a,b], ctx) => { ... }))
 */
export function variableChanges<T = any>(
	keys: string[],
	callback: (values: T[], ctx: UpdateContext<any>) => void
) {
	let previousValues: (T | undefined)[] = new Array(keys.length).fill(undefined);
	return (ctx: UpdateContext<any>) => {
		// @ts-ignore - stage is optional on UpdateContext
		const reader = (k: string) => ctx.stage?.getVariable?.(k) as T;
		const currentValues = keys.map(reader);
		const hasAnyChange = currentValues.some((val, idx) => previousValues[idx] !== val);
		if (hasAnyChange) {
			const allPrevUndef = previousValues.every((v) => v === undefined);
			const allCurrUndef = currentValues.every((v) => v === undefined);
			if (!(allPrevUndef && allCurrUndef)) {
				callback(currentValues as T[], ctx);
			}
			previousValues = currentValues;
		}
	};
}


