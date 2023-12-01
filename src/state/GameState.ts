import { GameOptions } from '../interfaces/Game';
import { PerspectiveType } from '../interfaces/Perspective';

const state = {
	id: '',
	perspective: PerspectiveType.ThirdPerson,
	globals: {},
	stage: {},
	stages: {},
	debug: {},
} as GameOptions;

// TODO: Hack until a new state management lib is implemented
//@ts-ignore
window['__game__'] = {};
//@ts-ignore
const gameState = window['__game__']['gameState'] = state;

const setGameState = (key: string, value: any) => {
	//@ts-ignore
	window['__game__'].gameState[key] = value;
}

export { gameState, setGameState };