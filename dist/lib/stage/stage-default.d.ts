import type { StageOptions, ZylemStageConfig } from './zylem-stage';
export declare const stageDefaultsState: Partial<ZylemStageConfig>;
/** Replace multiple defaults at once (shallow merge). */
export declare function setStageDefaults(partial: Partial<ZylemStageConfig>): void;
/** Reset defaults back to library defaults. */
export declare function resetStageDefaults(): void;
export declare function getStageOptions(options: StageOptions): StageOptions;
/** Get a plain object copy of the current defaults. */
export declare function getStageDefaultConfig(): Partial<ZylemStageConfig>;
//# sourceMappingURL=stage-default.d.ts.map