import { proxy } from 'valtio/vanilla';
import { BaseGlobals, BasicTypes } from './game-interfaces';

const state = proxy({
	id: '',
	globals: {} as BaseGlobals,
	time: 0,
});

export function setGlobalState<
	TGlobals extends BaseGlobals,
	K extends keyof TGlobals = keyof TGlobals
>(key: K, value: TGlobals[K]): void;

export function setGlobalState(key: string, value: BasicTypes): void {
	(state.globals as any)[key as string] = value as any;
}

export function getGlobalState<TGlobals extends BaseGlobals>(): TGlobals;

export function getGlobalState<
	TGlobals extends BaseGlobals,
	K extends keyof TGlobals = keyof TGlobals
>(key: K): TGlobals[K];

export function getGlobalState(key?: string): any {
	if (key !== undefined) {
		return (state.globals as any)[key as string];
	}
	return state.globals as any;
}

export { state };