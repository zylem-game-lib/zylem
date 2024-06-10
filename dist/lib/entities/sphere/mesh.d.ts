import { BaseMesh, CreateMeshParameters } from "~/lib/core/mesh";
export declare class SphereMesh extends BaseMesh {
    _radius: number;
    createMesh({ group, radius, materials }: CreateMeshParameters): void;
}
