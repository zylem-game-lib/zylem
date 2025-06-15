import { Vector2, Vector3 } from "three";
import { PerspectiveType } from "./perspective";
import { ZylemCamera } from "./zylem-camera";
export interface CameraOptions {
    perspective: PerspectiveType;
    position: Vector3;
    target: Vector3;
    zoom: number;
    screenResolution?: Vector2;
}
export declare class CameraWrapper {
    cameraRef: ZylemCamera;
    constructor(camera: ZylemCamera);
}
export declare function camera(options: CameraOptions): CameraWrapper;
