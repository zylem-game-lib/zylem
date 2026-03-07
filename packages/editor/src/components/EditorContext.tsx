/**
 * EditorContext - SolidJS context for editor state
 * 
 * Provides access to debug, game, and stage state throughout the editor component tree.
 */

import { createContext, useContext, onCleanup, type JSX } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { subscribe } from 'valtio/vanilla';
import { debugState, type DebugState } from './entities/entities-state';
import { gameState, type GameState } from './game/game-state';
import { stageState } from './stages/stage-state';
import type { StageStateInterface } from '../types';

export interface EditorContextValue {
	debug: DebugState;
	game: GameState;
	stage: StageStateInterface;
}

const EditorContext = createContext<EditorContextValue>();

export interface EditorProviderProps {
	children: JSX.Element;
}

/**
 * EditorProvider wraps the editor UI and provides access to all editor state.
 */
export function EditorProvider(props: EditorProviderProps) {
	// Create SolidJS stores from valtio proxies
	const [debug, setDebug] = createStore<DebugState>({ ...debugState });
	const [game, setGame] = createStore<GameState>({ ...gameState });
	const [stage, setStage] = createStore<StageStateInterface>({ ...stageState });

	// Sync valtio → SolidJS
	const unsubDebug = subscribe(debugState, () => {
		if (debug.paused !== debugState.paused) {
			setDebug('paused', debugState.paused);
		}
		if (debug.tool !== debugState.tool) {
			setDebug('tool', debugState.tool);
		}
		if (debug.selectedEntityId !== debugState.selectedEntityId) {
			setDebug('selectedEntityId', debugState.selectedEntityId);
		}
		if (debug.hoveredEntityId !== debugState.hoveredEntityId) {
			setDebug('hoveredEntityId', debugState.hoveredEntityId);
		}
		// Sets are mutated in place, so compare contents and copy only when changed.
		const nextFlags = debugState.flags;
		if (
			debug.flags.size !== nextFlags.size
			|| [...debug.flags].some((flag) => !nextFlags.has(flag))
		) {
			setDebug('flags', new Set(nextFlags));
		}
	});

	const unsubGame = subscribe(gameState, () => {
		if (game.id !== gameState.id) {
			setGame('id', gameState.id);
		}
		if (game.time !== gameState.time) {
			setGame('time', gameState.time);
		}
		setGame('globals', reconcile(gameState.globals));
		if (gameState.config === null) {
			if (game.config !== null) {
				setGame('config', null);
			}
		} else {
			setGame('config', reconcile(gameState.config));
		}
	});

	const unsubStage = subscribe(stageState, () => {
		if (stageState.config === null) {
			if (stage.config !== null) {
				setStage('config', null);
			}
		} else {
			setStage('config', reconcile(stageState.config));
		}
		if (stage.backgroundColor !== stageState.backgroundColor) {
			setStage('backgroundColor', stageState.backgroundColor);
		}
		if (stage.backgroundImage !== stageState.backgroundImage) {
			setStage('backgroundImage', stageState.backgroundImage);
		}
		setStage('inputs', reconcile(stageState.inputs));
		setStage('variables', reconcile(stageState.variables));
		setStage('gravity', reconcile(stageState.gravity));
		setStage('entities', reconcile(stageState.entities));
	});

	onCleanup(() => {
		unsubDebug();
		unsubGame();
		unsubStage();
	});

	const value: EditorContextValue = {
		debug,
		game,
		stage,
	};

	return (
		<EditorContext.Provider value={value}>
			{props.children}
		</EditorContext.Provider>
	);
}

/**
 * Hook to access editor state from any component within EditorProvider.
 */
export function useEditor(): EditorContextValue {
	const context = useContext(EditorContext);
	if (!context) {
		throw new Error('useEditor must be used within an EditorProvider');
	}
	return context;
}
