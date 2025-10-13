export declare const AspectRatio: {
    readonly FourByThree: number;
    readonly SixteenByNine: number;
    readonly TwentyOneByNine: number;
    readonly OneByOne: number;
};
export type AspectRatioValue = (typeof AspectRatio)[keyof typeof AspectRatio] | number;
/**
 * AspectRatioDelegate manages sizing a canvas to fit within a container
 * while preserving a target aspect ratio. It notifies a consumer via
 * onResize when the final width/height are applied so renderers/cameras
 * can update their viewports.
 */
export declare class AspectRatioDelegate {
    container: HTMLElement;
    canvas: HTMLCanvasElement;
    aspectRatio: number;
    onResize?: (width: number, height: number) => void;
    private handleResizeBound;
    constructor(params: {
        container: HTMLElement;
        canvas: HTMLCanvasElement;
        aspectRatio: AspectRatioValue;
        onResize?: (width: number, height: number) => void;
    });
    /** Attach window resize listener and apply once. */
    attach(): void;
    /** Detach window resize listener. */
    detach(): void;
    /** Compute the largest size that fits container while preserving aspect. */
    measure(): {
        width: number;
        height: number;
    };
    /** Apply measured size to canvas and notify. */
    apply(): void;
}
