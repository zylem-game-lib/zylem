import { StageBlueprint } from '../core/blueprints';
export declare const stageState: {
    previous: StageBlueprint | null;
    current: StageBlueprint | null;
    next: StageBlueprint | null;
    isLoading: boolean;
};
export declare const StageManager: {
    staticRegistry: Map<string, {
        name?: string | undefined;
        assets?: string[] | undefined;
        id: string;
        entities: {
            position?: [number, number] | undefined;
            data?: {
                [x: string]: any;
            } | undefined;
            id: string;
            type: string;
        }[];
    }>;
    registerStaticStage(id: string, blueprint: StageBlueprint): void;
    loadStageData(stageId: string): Promise<StageBlueprint>;
    transitionForward(nextStageId: string, loadStaticStage?: (id: string) => Promise<StageBlueprint>): Promise<void>;
    /**
     * Manually set the next stage to pre-load it.
     */
    preloadNext(stageId: string, loadStaticStage?: (id: string) => Promise<StageBlueprint>): Promise<void>;
};
//# sourceMappingURL=stage-manager.d.ts.map