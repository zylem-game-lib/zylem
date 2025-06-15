import { BufferGeometry, Material, Mesh } from 'three';
import { EntityOptions } from '../core';
/**
 * TODO: allow for multiple materials requires geometry groups
 * TODO: allow for instanced uniforms
 * TODO: allow for geometry groups
 * TODO: allow for batched meshes
 * import { InstancedUniformsMesh } from 'three-instanced-uniforms-mesh';
 * may not need geometry groups for shaders though
 * setGeometry<T extends BufferGeometry>(geometry: T) {
 *   MeshBuilder.bachedMesh = new BatchedMesh(10, 5000, 10000, material);
 * }
 */
export type MeshBuilderOptions = Partial<Pick<EntityOptions, 'batched' | 'material'>>;
export declare class MeshBuilder {
    build(meshOptions: MeshBuilderOptions, geometry: BufferGeometry, materials: Material[]): Mesh;
    postBuild(): void;
}
