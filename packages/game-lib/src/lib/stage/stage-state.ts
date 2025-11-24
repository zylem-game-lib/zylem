import { Color, Vector3 } from 'three';
import { proxy } from 'valtio/vanilla';
import { BaseEntityInterface } from '../types/entity-types';
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

const setEntitiesToStage = (entities: Partial<BaseEntityInterface>[]) => {
	stageState.entities = entities;
};

const setStageVariable = (key: string, value: any) => {
	// Create or update the variable key
	stageState.variables[key] = value;
};

const getStageVariable = (key: string) => {
	if (stageState.variables.hasOwnProperty(key)) {
		return stageState.variables[key];
	} else {
		console.warn(`Stage variable ${key} not found`);
	}
};

/** Replace the entire stage variables object (used on stage load). */
const setStageVariables = (variables: Record<string, any>) => {
	stageState.variables = { ...variables };
};

/** Reset all stage variables (used on stage unload). */
const resetStageVariables = () => {
	stageState.variables = {};
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
	
	setStageBackgroundColor,
	setStageBackgroundImage,
	
	stageStateToString,
	setStageVariable,
	getStageVariable,
	setStageVariables,
	resetStageVariables,
};