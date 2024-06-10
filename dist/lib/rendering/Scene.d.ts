import { Scene, Vector2, WebGLRenderer, Object3D, Vector3 } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { Entity, GameEntity } from '../interfaces/entity';
import { SetupCallback } from '~/lib/interfaces/game';
import { EntityParameters } from '../core/entity';
import { ZylemCamera } from '../core/camera';
export declare class ZylemScene implements Entity<ZylemScene> {
    type: string;
    _setup?: SetupCallback;
    scene: Scene;
    screenResolution: Vector2;
    renderer: WebGLRenderer;
    composer: EffectComposer;
    zylemCamera: ZylemCamera;
    containerElement: HTMLElement | null;
    constructor(id: string);
    setup(): void;
    destroy(): void;
    update({ delta }: Partial<EntityParameters<ZylemScene>>): void;
    setupCamera(scene: Scene): void;
    setupLighting(scene: Scene): void;
    setupRenderer(): void;
    updateRenderer(width: number, height: number): void;
    add(object: Object3D, position?: Vector3): void;
    addEntity(entity: GameEntity<any>): void;
    debugScene(): void;
}
