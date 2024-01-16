import { Vector3 } from "three";
import { Constructor } from "./Composable";
import { OptionalVector } from "~/lib/interfaces/entity";
export declare function Moveable<CBase extends Constructor>(Base: CBase): {
    new (...args: any[]): {
        [x: string]: any;
        moveX(delta: number): void;
        moveY(delta: number): void;
        moveZ(delta: number): void;
        moveXY(deltaX: number, deltaY: number): void;
        moveForwardXY(delta: number): void;
        velocity: Vector3;
        _rotation2DAngle: number;
        _normalizeAngleTo2Pi(angle: number): number;
        rotate(delta: number): void;
        rotateY(delta: number): void;
        rotateZ(delta: number): void;
        setRotationY(y: number): void;
        setRotationX(x: number): void;
        setRotationZ(z: number): void;
        setRotation(x: number, y: number, z: number): void;
        getRotation(): any;
        setPosition(x: number, y: number, z: number): void;
        getPosition(): Vector3;
        getVelocity(): Vector3;
        getDirection2D(): OptionalVector;
        wrapAroundXY(boundsX: number, boundsY: number): void;
    };
} & CBase;
