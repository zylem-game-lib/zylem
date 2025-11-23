import { ColliderDesc } from "@dimforge/rapier3d-compat";
import { GameEntity, GameEntityOptions } from "./entity";
import { BufferGeometry, Group, Material } from "three";
import { CollisionBuilder } from "../collision/collision-builder";
import { MeshBuilder } from "../graphics/mesh";
import { MaterialBuilder, MaterialOptions } from "../graphics/material";
import { Vec3 } from "../core/vector";
export declare abstract class EntityCollisionBuilder extends CollisionBuilder {
    abstract collider(options: GameEntityOptions): ColliderDesc;
}
export declare abstract class EntityMeshBuilder extends MeshBuilder {
    build(options: GameEntityOptions): BufferGeometry;
    postBuild(): void;
}
export declare abstract class EntityBuilder<T extends GameEntity<U> & P, U extends GameEntityOptions, P = any> {
    protected meshBuilder: EntityMeshBuilder | null;
    protected collisionBuilder: EntityCollisionBuilder | null;
    protected materialBuilder: MaterialBuilder | null;
    protected options: Partial<U>;
    protected entity: T;
    constructor(options: Partial<U>, entity: T, meshBuilder: EntityMeshBuilder | null, collisionBuilder: EntityCollisionBuilder | null);
    withPosition(setupPosition: Vec3): this;
    withMaterial(options: Partial<MaterialOptions>, entityType: symbol): Promise<this>;
    applyMaterialToGroup(group: Group, materials: Material[]): void;
    build(): Promise<T>;
    protected abstract createEntity(options: Partial<U>): T;
}
//# sourceMappingURL=builder.d.ts.map