import { Group, Mesh, Object3D, Camera, Vector2, WebGLRenderer, Scene, Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RigidBody, Collider, KinematicCharacterController } from '@dimforge/rapier3d-compat';

declare const Perspectives: {
    readonly FirstPerson: "first-person";
    readonly ThirdPerson: "third-person";
    readonly Isometric: "isometric";
    readonly Flat2D: "flat-2d";
    readonly Fixed2D: "fixed-2d";
};
type PerspectiveType = (typeof Perspectives)[keyof typeof Perspectives];

type LifecycleFunction<T> = (params?: any) => void;
interface Entity<T = any> {
    setup: (entity: T) => void;
    destroy: () => void;
    update: LifecycleFunction<T>;
    type: string;
    _collision?: (entity: any, other: any, globals?: any) => void;
    _destroy?: (globals?: any) => void;
    name?: string;
    tag?: Set<string>;
}
interface StageEntity extends Entity {
    uuid: string;
    body: RigidBody;
    group: Group;
    mesh: Mesh;
    instanceId: number;
    collider: Collider;
    controlledRotation: boolean;
    characterController: KinematicCharacterController;
    name: string;
    markedForRemoval: boolean;
}

/**
 * Interface for perspective-specific camera controllers
 */
interface PerspectiveController {
    setup(params: {
        screenResolution: Vector2;
        renderer: WebGLRenderer;
        scene: Scene;
        camera: ZylemCamera;
    }): void;
    update(delta: number): void;
    resize(width: number, height: number): void;
}
interface CameraDebugState {
    enabled: boolean;
    selected: string[];
}
interface CameraDebugDelegate {
    subscribe(listener: (state: CameraDebugState) => void): () => void;
    resolveTarget(uuid: string): Object3D | null;
}
declare class ZylemCamera {
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

interface CameraOptions {
    perspective?: PerspectiveType;
    position?: Vector3;
    target?: Vector3;
    zoom?: number;
    screenResolution?: Vector2;
}
declare class CameraWrapper {
    cameraRef: ZylemCamera;
    constructor(camera: ZylemCamera);
}
declare function camera(options: CameraOptions): CameraWrapper;

export { type CameraDebugDelegate as C, type Entity as E, type LifecycleFunction as L, type PerspectiveType as P, ZylemCamera as Z, Perspectives as a, type CameraDebugState as b, camera as c, CameraWrapper as d };
