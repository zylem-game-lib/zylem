export type RetroResolution = {
    key: string;
    width: number;
    height: number;
    notes?: string;
};
export type RetroPreset = {
    displayAspect: number;
    resolutions: RetroResolution[];
};
/**
 * Retro and console display presets.
 * displayAspect represents the intended display aspect (letterboxing target),
 * not necessarily the raw pixel aspect of internal buffers.
 */
declare const RetroPresets: Record<string, RetroPreset>;
export type RetroPresetKey = keyof typeof RetroPresets;
export declare function getDisplayAspect(preset: RetroPresetKey): number;
export declare function getPresetResolution(preset: RetroPresetKey, key?: string): RetroResolution | undefined;
export declare function parseResolution(text: string): {
    width: number;
    height: number;
} | null;
export {};
//# sourceMappingURL=game-retro-resolutions.d.ts.map