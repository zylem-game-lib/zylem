/**
 * Game state for the game section.
 * Manages global game variables and state.
 */

import { proxy } from 'valtio';
import { editorEvents } from '../events';

export interface GameState {
    id: string;
    globals: Record<string, unknown>;
    time: number;
}

export const gameState = proxy<GameState>({
    id: '',
    globals: {},
    time: 0,
});

/**
 * Get the entire globals object.
 */
export function getGlobalState(): Record<string, unknown> {
    return gameState.globals;
}

/**
 * Get a specific global value by key.
 */
export function getGlobal<T = unknown>(key: string): T | undefined {
    return gameState.globals[key] as T | undefined;
}

/**
 * Set a global value.
 */
export function setGlobal(key: string, value: unknown): void {
    gameState.globals[key] = value;
}

// Subscribe to external events
editorEvents.on<Partial<GameState>>('game', (event) => {
    const payload = event.payload;
    if (payload.id !== undefined) gameState.id = payload.id;
    if (payload.time !== undefined) gameState.time = payload.time;
    if (payload.globals !== undefined) {
        // Merge globals rather than replace
        Object.assign(gameState.globals, payload.globals);
    }
});

// Backwards compatibility alias
export { gameState as state };
