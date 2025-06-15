import { StageEntity } from '../interfaces/entity';
import RAPIER from '@dimforge/rapier3d-compat';
export type StageSystem = {
    _childrenMap: Map<string, StageEntity & {
        body: RAPIER.RigidBody;
    }>;
};
export declare const position: import("bitecs").ComponentType<{
    x: "f32";
    y: "f32";
    z: "f32";
}>;
export declare const rotation: import("bitecs").ComponentType<{
    x: "f32";
    y: "f32";
    z: "f32";
    w: "f32";
}>;
export declare const scale: import("bitecs").ComponentType<{
    x: "f32";
    y: "f32";
    z: "f32";
}>;
export default function createTransformSystem(stage: StageSystem): import("bitecs").System<[], import("bitecs").IWorld>;
