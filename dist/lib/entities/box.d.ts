import { ColliderDesc } from '@dimforge/rapier3d-compat';
import { BoxGeometry } from 'three';
import { BaseNode } from '../core/base-node';
import { DebugInfoBuilder, EntityBuilder, EntityCollisionBuilder, EntityMeshBuilder, EntityOptions, GameEntity } from './entity';
type ZylemBoxOptions = EntityOptions;
export declare class BoxCollisionBuilder extends EntityCollisionBuilder {
    collider(options: EntityOptions): ColliderDesc;
}
export declare class BoxMeshBuilder extends EntityMeshBuilder {
    buildGeometry(options: EntityOptions): BoxGeometry;
}
export declare class BoxBuilder extends EntityBuilder<ZylemBox, ZylemBoxOptions> {
    protected createEntity(options: Partial<ZylemBoxOptions>): ZylemBox;
}
export declare const BOX_TYPE: unique symbol;
export declare class ZylemBox extends GameEntity<ZylemBoxOptions> {
    static type: symbol;
    constructor(options?: ZylemBoxOptions);
}
export declare class BoxDebugInfoBuilder extends DebugInfoBuilder {
    buildInfo(options: EntityOptions): Record<string, any>;
}
type BoxOptions = BaseNode | ZylemBoxOptions;
export declare function box(...args: Array<BoxOptions>): Promise<ZylemBox>;
export {};
