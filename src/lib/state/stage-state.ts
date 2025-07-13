import { Color, Vector3 } from 'three';
import { isObject, isString, observable } from '@simplyianm/legend-state';
import { StageState } from '../core/stage/zylem-stage';
import { GameEntity } from '../entities/entity';

const stageState$ = observable({
	backgroundColor: new Color(Color.NAMES.cornflowerblue),
	backgroundImage: null,
	inputs: {
		p1: ['gamepad-1', 'keyboard-1'],
		p2: ['gamepad-2', 'keyboard-2'],
	},
	variables: {},
	gravity: new Vector3(0, 0, 0),
	entities: [],
} as StageState);

const stageState = stageState$.get();

const setStageState = (state: StageState) => {
	stageState$.set(state);
};

const setStageBackgroundColor = (value: Color) => {
	stageState$.backgroundColor.set(value);
};

const setStageBackgroundImage = (value: string | null) => {
	stageState$.backgroundImage.set(value);
};

const setEntitiesToStage = (entities: GameEntity<any>[]) => {
	stageState$.entities.set(entities);
};

const stageStateToString = (state: StageState) => {
	let string = `\n`;
	for (const key in state) {
		const value = state[key as keyof StageState];
		string += `${key}:\n`;
		if (key === 'entities') {
			for (const entity of state.entities) {
				string += `  ${entity.uuid}: ${entity.name}\n`;
			}
			continue;
		}
		if (isObject(value)) {
			for (const subKey in value as Record<string, any>) {
				const subValue = value?.[subKey as keyof typeof value];
				if (subValue) {
					string += `  ${subKey}: ${subValue}\n`;
				}
			}
		} else if (isString(value)) {
			string += `  ${key}: ${value}\n`;
		}
	}
	return string;
};

export { stageState, stageState$, setStageState, setStageBackgroundColor, setStageBackgroundImage, setEntitiesToStage, stageStateToString };