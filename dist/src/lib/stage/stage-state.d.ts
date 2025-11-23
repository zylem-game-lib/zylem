import { Color } from 'three';
import { StageStateInterface } from '../types/stage-types';
declare const stageState: StageStateInterface;
declare const setStageBackgroundColor: (value: Color) => void;
declare const setStageBackgroundImage: (value: string | null) => void;
declare const setStageVariable: (key: string, value: any) => void;
declare const getStageVariable: (key: string) => any;
/** Replace the entire stage variables object (used on stage load). */
declare const setStageVariables: (variables: Record<string, any>) => void;
/** Reset all stage variables (used on stage unload). */
declare const resetStageVariables: () => void;
declare const stageStateToString: (state: StageStateInterface) => string;
export { stageState, setStageBackgroundColor, setStageBackgroundImage, stageStateToString, setStageVariable, getStageVariable, setStageVariables, resetStageVariables, };
//# sourceMappingURL=stage-state.d.ts.map