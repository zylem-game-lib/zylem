import { Group, Mesh, Color } from 'three';
import { ColliderDesc, RigidBody, RigidBodyDesc } from '@dimforge/rapier3d-compat';
import { EntityOptions, GameEntity } from "../interfaces/entity";
export declare class ZylemSphere implements GameEntity<ZylemSphere> {
    _type: string;
    group: Group;
    mesh: Mesh;
    body?: RigidBody;
    bodyDescription: RigidBodyDesc;
    radius?: number;
    color: Color;
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
