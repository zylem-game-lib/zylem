import { Vector2, Vector3 } from "three";
import { BaseMesh, CreateMeshParameters } from "~/lib/core/mesh";
export declare class PlaneMesh extends BaseMesh {
    _tile: Vector2;
    size: Vector3;
    heights: number[];
    subdivisions: number;
    createMesh({ group, tile, materials }: CreateMeshParameters): void;
}
