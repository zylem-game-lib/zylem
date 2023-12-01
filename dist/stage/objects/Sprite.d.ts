import { EntityClass, EntityOptions, GameEntity } from "../../interfaces/Entity";
import { RigidBody, RigidBodyDesc, ColliderDesc } from "@dimforge/rapier3d-compat";
import { Mesh, BufferGeometry, Material, Vector3, Sprite } from "three";
export declare class ZylemSprite extends EntityClass implements GameEntity<ZylemSprite> {
    mesh: Mesh<BufferGeometry, Material | Material[]>;
    body?: RigidBody | undefined;
    bodyDescription: RigidBodyDesc;
    constraintBodies?: RigidBody[] | undefined;
    _update: (delta: number, options: any) => void;
    _setup: (entity: ZylemSprite) => void;
    _type: string;
    _collision?: ((entity: any, other: any, globals?: any) => void) | undefined;
    _destroy?: ((globals?: any) => void) | undefined;
    name?: string | undefined;
    tag?: Set<string> | undefined;
    images?: string[] | undefined;
    spriteIndex: number;
    sprites: Sprite[];
    size: Vector3;
    constructor(options: EntityOptions);
    setup(): void;
    update(delta: number, { inputs }: any): void;
    destroy(): void;
    createBodyDescription(): RigidBodyDesc;
    createMesh(vector3?: Vector3 | undefined): Mesh<BufferGeometry, Material | Material[]>;
    createSpritesFromImages(): void;
    createCollider(isSensor?: boolean): ColliderDesc;
}
