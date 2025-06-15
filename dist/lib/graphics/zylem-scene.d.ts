import { Scene, Object3D, Vector3 } from 'three';
import { Entity } from '../interfaces/entity';
import { SetupCallback } from '~/lib/interfaces/game';
import { GameEntity } from '../entities/entity';
import { ZylemCamera } from '../camera/zylem-camera';
export declare class ZylemScene implements Entity<ZylemScene> {
    type: string;
    _setup?: SetupCallback;
    scene: Scene;
    zylemCamera: ZylemCamera;
    containerElement: HTMLElement | null;
    constructor(id: string, camera: ZylemCamera);
    /**
     * Setup the container element and append camera's renderer
     */
    private setupContainer;
    setup(): void;
    destroy(): void;
    update({ delta }: Partial<any>): void;
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
