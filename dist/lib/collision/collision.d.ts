import { RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { Color } from "three";
import { Component } from "../core/ecs";
export declare class BaseCollision implements CollisionComponent {
    static: boolean;
    isSensor: boolean;
    bodyDescription: RigidBodyDesc;
    constructor({ isDynamicBody }: {
        isDynamicBody?: boolean | undefined;
    });
}
export interface CollisionComponent extends Component {
    static: boolean;
    isSensor: boolean;
    bodyDescription: RigidBodyDesc;
}
export interface CollisionDebugComponent extends Component {
    active: boolean;
    color: Color;
}
