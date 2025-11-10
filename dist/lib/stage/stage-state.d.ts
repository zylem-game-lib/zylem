import { Color } from 'three';
import { BaseEntityInterface } from '../types/entity-types';
import { StageStateInterface } from '../types/stage-types';
declare const stageState: StageStateInterface;
declare const setStageState: (state: StageStateInterface) => void;
declare const setStageBackgroundColor: (value: Color) => void;
declare const setStageBackgroundImage: (value: string | null) => void;
declare const setEntitiesToStage: (entities: Partial<BaseEntityInterface>[]) => void;
declare const setStageVariable: (key: string, value: any) => void;
declare const getStageVariable: (key: string) => any;
/** Replace the entire stage variables object (used on stage load). */
declare const setStageVariables: (variables: Record<string, any>) => void;
/** Reset all stage variables (used on stage unload). */
declare const resetStageVariables: () => void;
declare const stageStateToString: (state: StageStateInterface) => string;
export { stageState, setStageState, setStageBackgroundColor, setStageBackgroundImage, setEntitiesToStage, stageStateToString, setStageVariable, getStageVariable, setStageVariables, resetStageVariables, };
//# sourceMappingURL=stage-state.d.ts.map