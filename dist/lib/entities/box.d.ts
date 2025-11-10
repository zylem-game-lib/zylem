import { ColliderDesc } from '@dimforge/rapier3d-compat';
import { BoxGeometry } from 'three';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { EntityBuilder } from './builder';
import { EntityCollisionBuilder } from './builder';
import { EntityMeshBuilder } from './builder';
type ZylemBoxOptions = GameEntityOptions;
export declare class BoxCollisionBuilder extends EntityCollisionBuilder {
    collider(options: GameEntityOptions): ColliderDesc;
}
export declare class BoxMeshBuilder extends EntityMeshBuilder {
    build(options: GameEntityOptions): BoxGeometry;
}
export declare class BoxBuilder extends EntityBuilder<ZylemBox, ZylemBoxOptions> {
    protected createEntity(options: Partial<ZylemBoxOptions>): ZylemBox;
}
export declare const BOX_TYPE: unique symbol;
export declare class ZylemBox extends GameEntity<ZylemBoxOptions> {
    static type: symbol;
    constructor(options?: ZylemBoxOptions);
    buildInfo(): Record<string, any>;
}
type BoxOptions = BaseNode | ZylemBoxOptions;
export declare function box(...args: Array<BoxOptions>): Promise<ZylemBox>;
export {};
//# sourceMappingURL=box.d.ts.map