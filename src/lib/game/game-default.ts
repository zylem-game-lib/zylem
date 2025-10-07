import { proxy } from 'valtio/vanilla';
import { stage, Stage } from '../stage/stage';
import type { BasicTypes, GlobalVariablesType, ZylemGameConfig, GameInputConfig } from './game-interfaces';

type InitialDefaults = Partial<ZylemGameConfig<Stage, any, GlobalVariablesType>>;
/**
 * Reactive defaults for building `Game` instances. These values are applied
 * automatically by the `game()` builder via `convertNodes` and can be changed
 * at runtime to influence future game creations.
 */
const initialDefaults: () => InitialDefaults = (): InitialDefaults => {
	return {
		id: 'zylem',
		globals: {} as GlobalVariablesType,
		stages: [stage()],
		debug: false,
		time: 0,
		input: undefined,
	};
}

export const gameDefaultsState = proxy<Partial<ZylemGameConfig<Stage, any, GlobalVariablesType>>>(
	{ ...initialDefaults() }
);

/** Replace multiple defaults at once (shallow merge). */
export function setGameDefaults(partial: Partial<ZylemGameConfig<Stage, any, GlobalVariablesType>>): void {
	Object.assign(gameDefaultsState, partial);
}

/** Reset defaults back to library defaults. */
export function resetGameDefaults(): void {
	Object.assign(gameDefaultsState, initialDefaults());
}

/**
 * Get a plain object copy of the current defaults.
 */
export function getGameDefaultConfig<TGlobals extends Record<string, BasicTypes> = GlobalVariablesType>(): {
	id: string;
	globals: TGlobals;
	stages: Stage[];
	debug?: boolean;
	time?: number;
	input?: GameInputConfig;
} {
	return {
		id: (gameDefaultsState.id as string) ?? 'zylem',
		globals: (gameDefaultsState.globals as TGlobals) ?? ({} as unknown as TGlobals),
		stages: (gameDefaultsState.stages as Stage[]) ?? [stage()],
		debug: gameDefaultsState.debug,
		time: gameDefaultsState.time,
		input: gameDefaultsState.input,
	};
}


