import { Color } from 'three';
import { observable } from '@simplyianm/legend-state';
import { StageState } from '../core/stage';

const stageState$ = observable({
	backgroundColor: new Color(Color.NAMES.cornflowerblue),
	backgroundImage: null,
	inputs: {
		p1: ['gamepad-1', 'keyboard-1'],
		p2: ['gamepad-2', 'keyboard-2'],
	},
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

export { stageState, setStageState, setStageBackgroundColor, setStageBackgroundImage };