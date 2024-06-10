import { Group, Material, Mesh, Object3D, Vector2 } from "three";
import { SizeVector } from "../interfaces/utility";
export interface BoxMeshInterface {
    createMesh: (params: CreateMeshParameters) => void;
}
export type CreateMeshParameters = {
    group: Group;
    tile?: Vector2;
    size?: SizeVector;
    radius?: number;
    object?: Object3D | null;
    materials: Material[];
};
export declare class BaseMesh {
    mesh: Mesh | null;
}
