import { StageInterface } from "../types";
import { GameInputConfig } from "./game-interfaces";
import { AspectRatio, AspectRatioValue } from "../device/aspect-ratio";
import { RetroPresetKey } from "./game-retro-resolutions";
export type GameConfigLike = Partial<{
    id: string;
    globals: Record<string, any>;
    stages: StageInterface[];
    debug: boolean;
    time: number;
    input: GameInputConfig;
    /** numeric value or key in AspectRatio */
    aspectRatio: AspectRatioValue | keyof typeof AspectRatio;
    /** console/display preset to derive aspect ratio */
    preset: RetroPresetKey;
    /** lock internal render buffer to this resolution (e.g., '256x240' or { width, height }) */
    resolution: string | {
        width: number;
        height: number;
    };
    fullscreen: boolean;
    /** CSS background value for document body */
    bodyBackground: string;
    /** existing container by reference */
    container: HTMLElement;
    /** create/find container by id */
    containerId: string;
    /** optional canvas if caller wants to manage it */
    canvas: HTMLCanvasElement;
}>;
export declare class GameConfig {
    id: string;
    globals: Record<string, any>;
    stages: StageInterface[];
    debug: boolean;
    time: number;
    input: GameInputConfig | undefined;
    aspectRatio: number;
    internalResolution: {
        width: number;
        height: number;
    } | undefined;
    fullscreen: boolean;
    bodyBackground: string | undefined;
    container: HTMLElement;
    containerId?: string | undefined;
    canvas?: HTMLCanvasElement | undefined;
    constructor(id: string, globals: Record<string, any>, stages: StageInterface[], debug: boolean, time: number, input: GameInputConfig | undefined, aspectRatio: number, internalResolution: {
        width: number;
        height: number;
    } | undefined, fullscreen: boolean, bodyBackground: string | undefined, container: HTMLElement, containerId?: string | undefined, canvas?: HTMLCanvasElement | undefined);
}
export declare function resolveGameConfig(user?: GameConfigLike): GameConfig;
/**
 * Factory for authoring configuration objects in user code.
 * Returns a plain object that can be passed to `game(...)`.
 */
export declare function gameConfig(config: GameConfigLike): GameConfigLike;
//# sourceMappingURL=game-config.d.ts.map