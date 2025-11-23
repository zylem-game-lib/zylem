import { Scene, Color, Object3D, Vector3 } from 'three';
import { Entity, LifecycleFunction } from '../interfaces/entity';
import { GameEntity } from '../entities/entity';
import { ZylemCamera } from '../camera/zylem-camera';
import { SetupFunction } from '../core/base-node-life-cycle';
interface SceneState {
    backgroundColor: Color | string;
    backgroundImage: string | null;
}
export declare class ZylemScene implements Entity<ZylemScene> {
    type: string;
    _setup?: SetupFunction<ZylemScene>;
    scene: Scene;
    zylemCamera: ZylemCamera;
    containerElement: HTMLElement | null;
    update: LifecycleFunction<ZylemScene>;
    _collision?: ((entity: any, other: any, globals?: any) => void) | undefined;
    _destroy?: ((globals?: any) => void) | undefined;
    name?: string | undefined;
    tag?: Set<string> | undefined;
    constructor(id: string, camera: ZylemCamera, state: SceneState);
    setup(): void;
    destroy(): void;
    /**
     * Setup camera with the scene
     */
    setupCamera(scene: Scene, camera: ZylemCamera): void;
    /**
     * Setup scene lighting
     */
    setupLighting(scene: Scene): void;
    /**
     * Update renderer size - delegates to camera
     */
    updateRenderer(width: number, height: number): void;
    /**
     * Add object to scene
     */
    add(object: Object3D, position?: Vector3): void;
    /**
     * Add game entity to scene
     */
    addEntity(entity: GameEntity<any>): void;
    /**
     * Add debug helpers to scene
     */
    debugScene(): void;
}
export {};
//# sourceMappingURL=zylem-scene.d.ts.map