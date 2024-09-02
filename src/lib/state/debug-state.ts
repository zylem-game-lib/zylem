import { observable } from "@simplyianm/legend-state";

const debugState$ = observable({
	on: false,
	configuration: {},
});

const debugState = debugState$.get();

const setDebugFlag = (flag: boolean = false) => {
	debugState$.on.set(flag);
}

export { debugState, setDebugFlag };