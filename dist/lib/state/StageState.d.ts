import { StageBlueprint } from '../interfaces/game';
declare const stageState: Pick<StageBlueprint, "backgroundColor" | "backgroundImage" | "perspective">;
declare const setStageBackgroundColor: (value: any) => void;
declare const setStageBackgroundImage: (value: any) => void;
declare const setStagePerspective: (value: any) => void;
export { stageState, setStageBackgroundColor, setStageBackgroundImage, setStagePerspective };
