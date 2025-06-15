import { observable } from '@simplyianm/legend-state';

export type DebugConfiguration = {
	showCollisionBounds?: boolean;
	showModelBounds?: boolean;
	showSpriteBounds?: boolean;
	//TODO: show movement vector? other world related possibilities
}

const debugState$ = observable({
	on: false,
	configuration: {
		showCollisionBounds: false,
		showModelBounds: false,
		showSpriteBounds: false,
	},
});

const debugState = debugState$.get();

const setDebugFlag = (flag: boolean = false) => {
	debugState$.on.set(flag);
};

export { debugState$, debugState, setDebugFlag };