import { Vector2, Camera, Vector3, Object3D, WebGLRenderer, Scene } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PerspectiveType } from './perspective';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { StageEntity } from '../interfaces/entity';
/**
 * Interface for perspective-specific camera controllers
 */
export interface PerspectiveController {
    setup(params: {
        screenResolution: Vector2;
        renderer: WebGLRenderer;
        scene: Scene;
        camera: ZylemCamera;
    }): void;
    update(delta: number): void;
    resize(width: number, height: number): void;
}
export interface CameraDebugState {
    enabled: boolean;
    selected: string[];
}
export interface CameraDebugDelegate {
    subscribe(listener: (state: CameraDebugState) => void): () => void;
    resolveTarget(uuid: string): Object3D | null;
}
export declare class ZylemCamera {
    cameraRig: Object3D;
    camera: Camera;
    screenResolution: Vector2;
    renderer: WebGLRenderer;
    composer: EffectComposer;
    _perspective: PerspectiveType;
    orbitControls: OrbitControls | null;
    target: StageEntity | null;
    sceneRef: Scene | null;
    frustumSize: number;
    perspectiveController: PerspectiveController | null;
    debugDelegate: CameraDebugDelegate | null;
    private debugUnsubscribe;
    private debugStateSnapshot;
    private orbitTarget;
    private orbitTargetWorldPos;
    constructor(perspective: PerspectiveType, screenResolution: Vector2, frustumSize?: number);
    /**
     * Setup the camera with a scene
     */
    setup(scene: Scene): Promise<void>;
    /**
     * Update camera and render
     */
    update(delta: number): void;
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
     * Get the DOM element for the renderer
     */
    getDomElement(): HTMLCanvasElement;
    private applyDebugState;
    private enableOrbitControls;
    private disableOrbitControls;
    private updateOrbitTargetFromSelection;
    private detachDebugDelegate;
}
//# sourceMappingURL=zylem-camera.d.ts.map