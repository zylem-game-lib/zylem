/**
 * Game state for the game section.
 * Manages global game variables and state.
 */

import { proxy } from 'valtio';
import { editorEvents } from '../events';

/** State dispatch event detail from game-lib */
interface StateDispatchEvent {
    scope: 'game' | 'stage' | 'entity';
    path: string;
    value: unknown;
    previousValue?: unknown;
}

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

// Subscribe to external events from legacy event bus
editorEvents.on<Partial<GameState>>('game', (event) => {
    const payload = event.payload;
    if (payload.id !== undefined) gameState.id = payload.id;
    if (payload.time !== undefined) gameState.time = payload.time;
    if (payload.globals !== undefined) {
        // Merge globals rather than replace
        Object.assign(gameState.globals, payload.globals);
    }
});

// Listen for state dispatch events from game-lib
if (typeof window !== 'undefined') {
    window.addEventListener('zylem:state:dispatch', ((event: CustomEvent<StateDispatchEvent>) => {
        const { scope, path, value } = event.detail;
        if (scope === 'game') {
            // Update the local globals state
            gameState.globals[path] = value;
        }
        // TODO: Handle 'stage' and 'entity' scopes when needed
    }) as EventListener);
}

// Backwards compatibility alias
export { gameState as state };

