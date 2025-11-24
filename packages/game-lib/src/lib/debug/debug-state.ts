import { proxy } from 'valtio';
import type { GameEntity } from '../entities/entity';

export type DebugTools = 'select' | 'translate' | 'rotate' | 'scale' | 'delete' | 'none';

export interface DebugState {
	enabled: boolean;
	paused: boolean;
	tool: DebugTools;
	selectedEntity: GameEntity<any> | null;
	hoveredEntity: GameEntity<any> | null;
	flags: Set<string>;
}

export const debugState = proxy<DebugState>({
	enabled: false,
	paused: false,
	tool: 'none',
	selectedEntity: null,
	hoveredEntity: null,
	flags: new Set(),
});

export function isPaused(): boolean {
	return debugState.paused;
}

export function setPaused(paused: boolean): void {
	debugState.paused = paused;
}

export function setDebugFlag(flag: string, value: boolean): void {
	if (value) {
		debugState.flags.add(flag);
	} else {
		debugState.flags.delete(flag);
	}
}

export function getDebugTool(): DebugTools {
	return debugState.tool;
}

export function setDebugTool(tool: DebugTools): void {
	debugState.tool = tool;
}

export function getSelectedEntity(): GameEntity<any> | null {
	return debugState.selectedEntity;
}

export function setSelectedEntity(entity: GameEntity<any> | null): void {
	debugState.selectedEntity = entity;
}

export function getHoveredEntity(): GameEntity<any> | null {
	return debugState.hoveredEntity;
}

export function setHoveredEntity(entity: GameEntity<any> | null): void {
	debugState.hoveredEntity = entity;
}

export function resetHoveredEntity(): void {
	debugState.hoveredEntity = null;
}
