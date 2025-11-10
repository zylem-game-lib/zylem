import { AspectRatioValue } from '../device/aspect-ratio';
export interface GameCanvasOptions {
    id: string;
    container?: HTMLElement;
    containerId?: string;
    canvas?: HTMLCanvasElement;
    bodyBackground?: string;
    fullscreen?: boolean;
    aspectRatio: AspectRatioValue | number;
}
/**
 * GameCanvas is a DOM delegate that owns:
 * - container lookup/creation and styling (including fullscreen centering)
 * - body background application
 * - canvas mounting into container
 * - aspect ratio sizing via AspectRatioDelegate
 */
export declare class GameCanvas {
    id: string;
    container: HTMLElement;
    canvas: HTMLCanvasElement;
    bodyBackground?: string;
    fullscreen: boolean;
    aspectRatio: number;
    private ratioDelegate;
    constructor(options: GameCanvasOptions);
    applyBodyBackground(): void;
    mountCanvas(): void;
    mountRenderer(rendererDom: HTMLCanvasElement, onResize: (width: number, height: number) => void): void;
    centerIfFullscreen(): void;
    attachAspectRatio(onResize: (width: number, height: number) => void): void;
    destroy(): void;
    private ensureContainer;
}
//# sourceMappingURL=game-canvas.d.ts.map