import { Color, Vector3 } from 'three';
import { proxy } from 'valtio';
import { GameEntityInterface } from '../types/entity-types';
import { StageStateInterface } from '../types/stage-types';

const stageState = proxy({
	backgroundColor: new Color(Color.NAMES.cornflowerblue),
	backgroundImage: null,
	inputs: {
		p1: ['gamepad-1', 'keyboard-1'],
		p2: ['gamepad-2', 'keyboard-2'],
	},
	variables: {},
	gravity: new Vector3(0, 0, 0),
	entities: [],
	stageRef: undefined,
} as StageStateInterface);

const setStageState = (state: StageStateInterface) => {
	Object.assign(stageState, state);
};

const setStageBackgroundColor = (value: Color) => {
	stageState.backgroundColor = value;
};

const setStageBackgroundImage = (value: string | null) => {
	stageState.backgroundImage = value;
};

const setEntitiesToStage = (entities: GameEntityInterface[]) => {
	stageState.entities = entities;
};

const setStageVariable = (key: string, value: any) => {
	if (stageState.variables.hasOwnProperty(key)) {
		stageState.variables[key] = value;
	} else {
		console.warn(`Stage variable ${key} not found`);
	}
};

const getStageVariable = (key: string) => {
	if (stageState.variables.hasOwnProperty(key)) {
		return stageState.variables[key];
	} else {
		console.warn(`Stage variable ${key} not found`);
	}
};

const stageStateToString = (state: StageStateInterface) => {
	let string = `\n`;
	for (const key in state) {
		const value = state[key as keyof StageStateInterface];
		string += `${key}:\n`;
		if (key === 'entities') {
			for (const entity of state.entities) {
				string += `  ${entity.uuid}: ${entity.name}\n`;
			}
			continue;
		}
		if (typeof value === 'object' && value !== null) {
			for (const subKey in value as Record<string, any>) {
				const subValue = value?.[subKey as keyof typeof value];
				if (subValue) {
					string += `  ${subKey}: ${subValue}\n`;
				}
			}
		} else if (typeof value === 'string') {
			string += `  ${key}: ${value}\n`;
		}
	}
	return string;
};

export {
	stageState,
	setStageState,
	setStageBackgroundColor,
	setStageBackgroundImage,
	setEntitiesToStage,
	stageStateToString,
	setStageVariable,
	getStageVariable,
};