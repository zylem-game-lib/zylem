import { Mesh } from 'three';
import { ColliderDesc, RigidBody, RigidBodyDesc } from '@dimforge/rapier3d-compat';
import { EntityClass, EntityOptions, GameEntity } from "../../interfaces/Entity";
export declare class ZylemSphere extends EntityClass implements GameEntity<ZylemSphere> {
    _type: string;
    mesh: Mesh;
    body?: RigidBody;
    bodyDescription: RigidBodyDesc;
    radius?: number;
    _update: (delta: number, options: any) => void;
    _setup: (entity: ZylemSphere) => void;
    constructor(options: EntityOptions);
    setup(): void;
    destroy(): void;
    update(delta: number, { inputs }: any): void;
    createMesh(radius?: number | undefined): Mesh<import("three").BufferGeometry, import("three").Material | import("three").Material[]>;
    createBodyDescription(): RigidBodyDesc;
    createCollider(isSensor?: boolean): ColliderDesc;
}
