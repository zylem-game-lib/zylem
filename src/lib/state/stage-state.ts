import { Color } from 'three';
import { observable } from '@simplyianm/legend-state';
import { Perspectives } from '../interfaces/perspective';
import { StageBlueprint } from '../interfaces/stage';

const stageState$ = observable({
	backgroundColor: Color.NAMES.cornflowerblue,
	backgroundImage: '',
	perspective: Perspectives
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