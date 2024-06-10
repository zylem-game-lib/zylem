import { Vector2, Camera, Vector3, Object3D, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { PerspectiveType } from '../interfaces/perspective';
import { GameEntity } from './game-entity';
export declare class ZylemCamera {
    cameraRig: Object3D;
    camera: Camera;
    renderer: WebGLRenderer;
    _perspective: PerspectiveType;
    orbitControls: OrbitControls | null;
    target: GameEntity<any> | null;
    constructor(screenResolution: Vector2, renderer: WebGLRenderer);
    [PerspectiveType.ThirdPerson](aspectRatio: number): Camera;
    [PerspectiveType.Fixed2D](aspectRatio: number, position: Vector3): Camera;
    [PerspectiveType.FirstPerson](): Camera;
    [PerspectiveType.Flat2D](aspectRatio: number, position: Vector3): Camera;
    [PerspectiveType.Isometric](aspectRatio: number, position: Vector3): Camera;
    update(): void;
    moveFollowCamera(): void;
    moveCamera(position: Vector3): void;
}
