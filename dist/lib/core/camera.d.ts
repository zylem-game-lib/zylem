import { Vector2, Camera, Vector3, Object3D, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { PerspectiveType, Perspectives } from '../interfaces/perspective';
import { GameEntity } from './game-entity';
export declare class ZylemCamera {
    cameraRig: Object3D;
    camera: Camera;
    renderer: WebGLRenderer;
    _perspective: PerspectiveType;
    orbitControls: OrbitControls | null;
    target: GameEntity<any> | null;
    constructor(screenResolution: Vector2, renderer: WebGLRenderer);
    [Perspectives.ThirdPerson](aspectRatio: number): Camera;
    [Perspectives.Fixed2D](aspectRatio: number, position: Vector3): Camera;
    [Perspectives.FirstPerson](): Camera;
    [Perspectives.Flat2D](aspectRatio: number, position: Vector3): Camera;
    [Perspectives.Isometric](aspectRatio: number, position: Vector3): Camera;
    update(): void;
    __update(): void;
    private moveCamera;
    move(position: Vector3): void;
    rotate(pitch: number, yaw: number, roll: number): void;
}
