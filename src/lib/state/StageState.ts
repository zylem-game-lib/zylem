import { StageBlueprint } from '../interfaces/game';
import { Color } from 'three';
import { observable } from '@simplyianm/legend-state';
import { PerspectiveType } from '../interfaces/Perspective';

const stageState$ = observable({
	backgroundColor: Color.NAMES.cornflowerblue,
	backgroundImage: '',
	perspective: PerspectiveType
} as unknown as Pick<StageBlueprint, 'backgroundColor' | 'backgroundImage' | 'perspective'>);

const stageState = stageState$.get();

const setStageBackgroundColor = (value: any) => {
	stageState$.backgroundColor.set(value);
}

const setStageBackgroundImage = (value: any) => {
	stageState$.backgroundImage.set(value);
}

const setStagePerspective = (value: any) => {
	stageState$.perspective.set(value);
}

export { stageState, setStageBackgroundColor, setStageBackgroundImage, setStagePerspective };