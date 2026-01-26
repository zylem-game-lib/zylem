import { Object3D, Camera, Vector2, WebGLRenderer, Scene, Vector3 } from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { S as StageEntity } from './entity-Bq_eNEDI.js';

declare const Perspectives: {
    readonly FirstPerson: "first-person";
    readonly ThirdPerson: "third-person";
    readonly Isometric: "isometric";
    readonly Flat2D: "flat-2d";
    readonly Fixed2D: "fixed-2d";
};
type PerspectiveType = (typeof Perspectives)[keyof typeof Perspectives];

interface CameraDebugState {
    enabled: boolean;
    selected: string[];
}
interface CameraDebugDelegate {
    subscribe(listener: (state: CameraDebugState) => void): () => void;
    resolveTarget(uuid: string): Object3D | null;
}

/**
 * Renderer type option for choosing rendering backend
 * - 'auto': Try WebGPU first, fall back to WebGL
 * - 'webgpu': Force WebGPU (error if not supported)
 * - 'webgl': Force WebGL
 */
type RendererType = 'auto' | 'webgpu' | 'webgl';
/**
 * Union type for renderer instances
 */
type ZylemRenderer = WebGLRenderer | WebGPURenderer;
/**
 * Check if WebGPU is supported in the current browser
 */
declare function isWebGPUSupported(): Promise<boolean>;
/**
 * Interface for perspective-specific camera controllers
 */
interface PerspectiveController {
    setup(params: {
        screenResolution: Vector2;
        renderer: ZylemRenderer;
        scene: Scene;
        camera: ZylemCamera;
    }): void;
    update(delta: number): void;
    resize(width: number, height: number): void;
}
declare class ZylemCamera {
    cameraRig: Object3D | null;
    camera: Camera;
    screenResolution: Vector2;
    renderer: ZylemRenderer;
    composer: EffectComposer;
    _perspective: PerspectiveType;
    target: StageEntity | null;
    sceneRef: Scene | null;
    frustumSize: number;
    rendererType: RendererType;
    private _isWebGPU;
    perspectiveController: PerspectiveController | null;
    private orbitController;
    constructor(perspective: PerspectiveType, screenResolution: Vector2, frustumSize?: number, rendererType?: RendererType);
    /**
     * Initialize renderer (must be called before setup)
     * This is async because WebGPU requires async initialization
     */
    initRenderer(): Promise<void>;
    /**
     * Check if using WebGPU renderer
     */
    get isWebGPU(): boolean;
    /**
     * Setup the camera with a scene
     */
    setup(scene: Scene): Promise<void>;
    /**
     * Update camera and render
     */
    update(delta: number): void;
    /**
     * Check if debug mode is active (orbit controls taking over camera)
     */
    isDebugModeActive(): boolean;
    /**
     * Dispose renderer, composer, controls, and detach from scene
     */
    destroy(): void;
    /**
     * Attach a delegate to react to debug state changes.
     */
    setDebugDelegate(delegate: CameraDebugDelegate | null): void;
    /**
     * Resize camera and renderer
     */
    resize(width: number, height: number): void;
    /**
     * Update renderer pixel ratio (DPR)
     */
    setPixelRatio(dpr: number): void;
    /**
     * Create camera based on perspective type
     */
    private createCameraForPerspective;
    /**
     * Initialize perspective-specific controller
     */
    private initializePerspectiveController;
    private createThirdPersonCamera;
    private createFirstPersonCamera;
    private createIsometricCamera;
    private createFlat2DCamera;
    private createFixed2DCamera;
    private moveCamera;
    move(position: Vector3): void;
    rotate(pitch: number, yaw: number, roll: number): void;
    /**
     * Check if this perspective type needs a camera rig
     */
    private needsRig;
    /**
     * Get the DOM element for the renderer
     */
    getDomElement(): HTMLCanvasElement;
}

interface CameraOptions {
    perspective?: PerspectiveType;
    position?: Vector3;
    target?: Vector3;
    zoom?: number;
    screenResolution?: Vector2;
    /**
     * Renderer type: 'auto' | 'webgpu' | 'webgl'
     * Use 'webgpu' for TSL shaders
     * @default 'webgl'
     */
    rendererType?: RendererType;
}
declare class CameraWrapper {
    cameraRef: ZylemCamera;
    constructor(camera: ZylemCamera);
}
declare function createCamera(options: CameraOptions): CameraWrapper;

export { type CameraDebugDelegate as C, type PerspectiveType as P, type RendererType as R, ZylemCamera as Z, type CameraDebugState as a, CameraWrapper as b, createCamera as c, Perspectives as d, type ZylemRenderer as e, isWebGPUSupported as i };
