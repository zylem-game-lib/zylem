import { Color } from 'three';
import { observable } from '@simplyianm/legend-state';
import { Perspectives } from '../interfaces/perspective';
import { StageState } from '../core/stage';

const stageState$ = observable({
	backgroundColor: Color.NAMES.cornflowerblue,
	backgroundImage: null,
	perspective: Perspectives.ThirdPerson,
	inputs: {
		p1: ['gamepad-1', 'keyboard-1'],
		p2: ['gamepad-2', 'keyboard-2'],
	},
} as unknown as StageState);

const stageState = stageState$.get();

const setStageState = (state: StageState) => {
	stageState$.set(state);
};

const setStageBackgroundColor = (value: any) => {
	stageState$.backgroundColor.set(value);
};

const setStageBackgroundImage = (value: any) => {
	stageState$.backgroundImage.set(value);
};

const setStagePerspective = (value: any) => {
	stageState$.perspective.set(value);
};

export { stageState, setStageState, setStageBackgroundColor, setStageBackgroundImage, setStagePerspective };