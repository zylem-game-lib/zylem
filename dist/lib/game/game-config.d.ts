import { StageInterface } from "../types";
import { GameInputConfig } from "./game-interfaces";
import { AspectRatio, AspectRatioValue } from "../device/aspect-ratio";
export type GameConfigLike = Partial<{
    id: string;
    globals: Record<string, any>;
    stages: StageInterface[];
    debug: boolean;
    time: number;
    input: GameInputConfig;
    /** numeric value or key in AspectRatio */
    aspectRatio: AspectRatioValue | keyof typeof AspectRatio;
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
    fullscreen: boolean;
    bodyBackground: string | undefined;
    container: HTMLElement;
    containerId?: string | undefined;
    canvas?: HTMLCanvasElement | undefined;
    constructor(id: string, globals: Record<string, any>, stages: StageInterface[], debug: boolean, time: number, input: GameInputConfig | undefined, aspectRatio: number, fullscreen: boolean, bodyBackground: string | undefined, container: HTMLElement, containerId?: string | undefined, canvas?: HTMLCanvasElement | undefined);
}
export declare function createDefaultGameConfig(base?: Partial<Pick<GameConfig, 'id' | 'debug' | 'time' | 'input'>> & {
    stages?: StageInterface[];
    globals?: Record<string, any>;
}): GameConfig;
export declare function resolveGameConfig(user?: GameConfigLike): GameConfig;
/**
 * Factory for authoring configuration objects in user code.
 * Returns a plain object that can be passed to `game(...)`.
 */
export declare function gameConfig(config: GameConfigLike): GameConfigLike;
