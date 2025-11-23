import { ColliderDesc } from '@dimforge/rapier3d-compat';
import { SphereGeometry } from 'three';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { EntityBuilder } from './builder';
import { EntityCollisionBuilder } from './builder';
import { EntityMeshBuilder } from './builder';
type ZylemSphereOptions = GameEntityOptions & {
    radius?: number;
};
export declare class SphereCollisionBuilder extends EntityCollisionBuilder {
    collider(options: ZylemSphereOptions): ColliderDesc;
}
export declare class SphereMeshBuilder extends EntityMeshBuilder {
    build(options: ZylemSphereOptions): SphereGeometry;
}
export declare class SphereBuilder extends EntityBuilder<ZylemSphere, ZylemSphereOptions> {
    protected createEntity(options: Partial<ZylemSphereOptions>): ZylemSphere;
}
export declare const SPHERE_TYPE: unique symbol;
export declare class ZylemSphere extends GameEntity<ZylemSphereOptions> {
    static type: symbol;
    constructor(options?: ZylemSphereOptions);
    buildInfo(): Record<string, any>;
}
type SphereOptions = BaseNode | Partial<ZylemSphereOptions>;
export declare function sphere(...args: Array<SphereOptions>): Promise<ZylemSphere>;
export {};
//# sourceMappingURL=sphere.d.ts.map