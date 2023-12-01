import { Scene, Vector2, WebGLRenderer, Object3D, Vector3 } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { ZylemCamera } from './ZylemCamera';
import { Entity, GameEntity } from '../interfaces/Entity';
import { ZylemHUD } from '../game/ZylemHUD';
export declare class ZylemScene implements Entity<ZylemScene> {
    _type: string;
    _setup?: (scene: ZylemScene, HUD: ZylemHUD) => void;
    _hud: ZylemHUD | null;
    scene: Scene;
    screenResolution: Vector2;
    renderer: WebGLRenderer;
    composer: EffectComposer;
    zylemCamera: ZylemCamera;
    constructor(id: string);
    setup(): void;
    destroy(): void;
    update(delta: number): void;
    setupCamera(scene: Scene): void;
    setupLighting(scene: Scene): void;
    setupRenderer(): void;
    updateRenderer(width: number, height: number): void;
    add(object: Object3D, position?: Vector3): void;
    addEntity(entity: GameEntity<any>): void;
}
