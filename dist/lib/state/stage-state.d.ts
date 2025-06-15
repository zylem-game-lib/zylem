import { Color } from 'three';
import { StageState } from '../core/stage/zylem-stage';
import { GameEntity } from '../entities/entity';
declare const stageState: StageState;
declare const setStageState: (state: StageState) => void;
declare const setStageBackgroundColor: (value: Color) => void;
declare const setStageBackgroundImage: (value: string | null) => void;
declare const setEntitiesToStage: (entities: GameEntity<any>[]) => void;
export { stageState, setStageState, setStageBackgroundColor, setStageBackgroundImage, setEntitiesToStage };
