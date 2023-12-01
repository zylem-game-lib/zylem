import { Vector3 } from "three";
import { Constructor } from "./Composable";
export declare function Moveable<CBase extends Constructor>(Base: CBase): {
    new (...args: any[]): {
        [x: string]: any;
        moveX(delta: number): void;
        moveY(delta: number): void;
        moveZ(delta: number): void;
        moveXY(deltaX: number, deltaY: number): void;
        setPosition(x: number, y: number, z: number): void;
        getPosition(): Vector3;
        getVelocity(): Vector3;
    };
} & CBase;
