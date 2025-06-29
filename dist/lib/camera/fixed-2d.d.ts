import { Scene, Vector2, WebGLRenderer } from 'three';
import { PerspectiveController, ZylemCamera } from './zylem-camera';
/**
 * Fixed 2D Camera Controller
 * Maintains a static 2D camera view with no automatic following or movement
 */
export declare class Fixed2DCamera implements PerspectiveController {
    screenResolution: Vector2 | null;
    renderer: WebGLRenderer | null;
    scene: Scene | null;
    cameraRef: ZylemCamera | null;
    constructor();
    /**
     * Setup the fixed 2D camera controller
     */
    setup(params: {
        screenResolution: Vector2;
        renderer: WebGLRenderer;
        scene: Scene;
        camera: ZylemCamera;
    }): void;
    /**
     * Update the fixed 2D camera
     * Fixed cameras don't need to update position/rotation automatically
     */
    update(delta: number): void;
    /**
     * Handle resize events for 2D camera
     */
    resize(width: number, height: number): void;
}
