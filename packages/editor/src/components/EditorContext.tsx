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
		setDebug(reconcile({
			enabled: debugState.enabled,
			paused: debugState.paused,
			tool: debugState.tool,
			selectedEntityId: debugState.selectedEntityId,
			hoveredEntityId: debugState.hoveredEntityId,
			flags: debugState.flags,
		}));
	});

	const unsubGame = subscribe(gameState, () => {
		setGame(reconcile({
			id: gameState.id,
			globals: { ...gameState.globals },
			time: gameState.time,
		}));
	});

	const unsubStage = subscribe(stageState, () => {
		setStage(reconcile({
			backgroundColor: stageState.backgroundColor,
			backgroundImage: stageState.backgroundImage,
			inputs: { ...stageState.inputs },
			variables: { ...stageState.variables },
			gravity: { ...stageState.gravity },
			entities: [...stageState.entities],
		}));
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
