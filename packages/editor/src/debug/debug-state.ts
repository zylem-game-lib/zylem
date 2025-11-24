import { proxy } from 'valtio/vanilla';
import { printToConsole } from './console/console-state';

type DebugConfiguration = {
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
	paused: false,
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

/**
 * Set the active debug tool and print the selection to the debug console.
 * @param tool The tool to activate
 */
const setDebugTool = (tool: keyof typeof DebugTools) => {
	debugState.tool = tool;
	if (tool === DebugTools.NONE) {
		printToConsole('Tool deselected');
		resetHoveredEntity();
	} else {
		printToConsole(`Tool selected: ${tool}`);
	}
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

export { debugState, setDebugFlag, setSelectedEntity,  setDebugTool, getDebugTool, setHoveredEntity, resetHoveredEntity, getHoveredEntity };

export const togglePause = () => {
	debugState.paused = !debugState.paused;
	printToConsole(debugState.paused ? 'Paused' : 'Resumed');
};

/**
 * Set pause state directly and print the new state to the console.
 * @param paused Whether to pause (true) or resume (false)
 */
export const setPaused = (paused: boolean) => {
	debugState.paused = paused;
	printToConsole(paused ? 'Paused' : 'Resumed');
};

export const isPaused = () => debugState.paused;