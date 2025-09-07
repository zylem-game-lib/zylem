import { ColliderDesc } from '@dimforge/rapier3d-compat';
import { Vector2 } from 'three';
import { TexturePath } from '../graphics/material';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { EntityBuilder } from './builder';
import { EntityCollisionBuilder } from './builder';
import { EntityMeshBuilder } from './builder';
import { XZPlaneGeometry } from '../graphics/geometries/XZPlaneGeometry';
type ZylemPlaneOptions = GameEntityOptions & {
    tile?: Vector2;
    repeat?: Vector2;
    texture?: TexturePath;
    subdivisions?: number;
};
export declare class PlaneCollisionBuilder extends EntityCollisionBuilder {
    collider(options: ZylemPlaneOptions): ColliderDesc;
}
export declare class PlaneMeshBuilder extends EntityMeshBuilder {
    heightData: Float32Array;
    columnsRows: Map<any, any>;
    build(options: ZylemPlaneOptions): XZPlaneGeometry;
    postBuild(): void;
}
export declare class PlaneBuilder extends EntityBuilder<ZylemPlane, ZylemPlaneOptions> {
    protected createEntity(options: Partial<ZylemPlaneOptions>): ZylemPlane;
}
export declare const PLANE_TYPE: unique symbol;
export declare class ZylemPlane extends GameEntity<ZylemPlaneOptions> {
    static type: symbol;
    constructor(options?: ZylemPlaneOptions);
}
type PlaneOptions = BaseNode | Partial<ZylemPlaneOptions>;
export declare function plane(...args: Array<PlaneOptions>): Promise<ZylemPlane>;
export {};
