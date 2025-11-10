import { Scene, Vector2, Vector3, WebGLRenderer } from 'three';
import { PerspectiveController, ZylemCamera } from './zylem-camera';
import { StageEntity } from '../interfaces/entity';
export interface ThirdPersonCameraOptions {
    target: StageEntity;
    distance: Vector3;
    screenResolution: Vector2;
    renderer: WebGLRenderer;
    scene: Scene;
}
export declare class ThirdPersonCamera implements PerspectiveController {
    distance: Vector3;
    screenResolution: Vector2 | null;
    renderer: WebGLRenderer | null;
    scene: Scene | null;
    cameraRef: ZylemCamera | null;
    constructor();
    /**
     * Setup the third person camera controller
     */
    setup(params: {
        screenResolution: Vector2;
        renderer: WebGLRenderer;
        scene: Scene;
        camera: ZylemCamera;
    }): void;
    /**
     * Update the third person camera
     */
    update(delta: number): void;
    /**
     * Handle resize events
     */
    resize(width: number, height: number): void;
    /**
     * Set the distance from the target
     */
    setDistance(distance: Vector3): void;
}
//# sourceMappingURL=third-person.d.ts.map