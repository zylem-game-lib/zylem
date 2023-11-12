import { StageOptions } from '@interfaces/Game';
import { Color } from 'three';

const initialState = {
	backgroundColor: Color.NAMES.cornflowerblue,
} as StageOptions;

// TODO: Hack until a new state management lib is implemented
//@ts-ignore
const stageState = window['__game__']['stageState'] = initialState;

const setStageState = (key: string, value: any) => {
	//@ts-ignore
	window['__game__'].stageState[key] = value;
}

export { stageState, setStageState };