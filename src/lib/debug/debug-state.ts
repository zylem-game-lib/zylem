import { proxy } from 'valtio';

export type DebugConfiguration = {
	showCollisionBounds?: boolean;
	showModelBounds?: boolean;
	showSpriteBounds?: boolean;
	//TODO: show movement vector? other world related possibilities
}

export const DebugTools = {
	NONE: 'NONE',
	SELECT: 'SELECT',
	ADD: 'ADD',
	DELETE: 'DELETE'
} as const;

const debugState = proxy({
	on: false,
	configuration: {
		showCollisionBounds: false,
		showModelBounds: false,
		showSpriteBounds: false,
	},
	hovered: null as string | null,
	selected: [] as string[],
	tool: DebugTools.NONE as keyof typeof DebugTools
});

const setDebugFlag = (flag: boolean = false) => {
	debugState.on = flag;
};

const setSelectedEntity = (uuid: string) => {
	debugState.selected.push(uuid);
}

const resetSelectedEntities = () => {
	debugState.selected = [];
}

const setDebugTool = (tool: keyof typeof DebugTools) => {
	debugState.tool = tool;
}

const getDebugTool = () => {
	return debugState.tool;
}

const setHoveredEntity = (uuid: string) => {
	debugState.hovered = uuid;
}

const resetHoveredEntity = () => {
	debugState.hovered = null;
}

const getHoveredEntity = () => {
	return debugState.hovered;
}

export { debugState, setDebugFlag, setSelectedEntity, resetSelectedEntities, setDebugTool, getDebugTool, setHoveredEntity, resetHoveredEntity, getHoveredEntity };