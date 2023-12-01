import { Vector2, Camera, Vector3, Object3D } from 'three';
import { PerspectiveType } from '../interfaces/Perspective';
export declare class ZylemCamera {
    cameraRig: Object3D;
    camera: Camera;
    constructor(screenResolution: Vector2);
    [PerspectiveType.ThirdPerson](aspectRatio: number): Camera;
    [PerspectiveType.Fixed2D](aspectRatio: number, position: Vector3): Camera;
    [PerspectiveType.FirstPerson](): Camera;
    [PerspectiveType.Flat2D](aspectRatio: number, position: Vector3): Camera;
    [PerspectiveType.Isometric](aspectRatio: number, position: Vector3): Camera;
    update(): void;
    moveFollowCamera(): void;
}
