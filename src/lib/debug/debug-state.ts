import { proxy } from 'valtio';

export type DebugConfiguration = {
	showCollisionBounds?: boolean;
	showModelBounds?: boolean;
	showSpriteBounds?: boolean;
	//TODO: show movement vector? other world related possibilities
}

const debugState = proxy({
	on: false,
	configuration: {
		showCollisionBounds: false,
		showModelBounds: false,
		showSpriteBounds: false,
	},
});

const setDebugFlag = (flag: boolean = false) => {
	debugState.on = flag;
};

export { debugState, setDebugFlag };