import { Color } from 'three';
import { observable } from '@simplyianm/legend-state';
import { StageState } from '../core/stage';
import { GameEntity } from '../entities/entity';

const stageState$ = observable({
	backgroundColor: new Color(Color.NAMES.cornflowerblue),
	backgroundImage: null,
	inputs: {
		p1: ['gamepad-1', 'keyboard-1'],
		p2: ['gamepad-2', 'keyboard-2'],
	},
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

export { stageState, setStageState, setStageBackgroundColor, setStageBackgroundImage, setEntitiesToStage };