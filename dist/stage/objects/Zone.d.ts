import { ColliderDesc, RigidBody, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { BoxGeometry, Color, Group, Mesh, MeshPhongMaterial, Vector3 } from "three";
import { Entity, EntityOptions, GameEntity } from "~/interfaces/Entity";
import { UpdateOptions } from "~/interfaces/Update";
export declare class ZylemZone implements GameEntity<ZylemZone> {
    _type: string;
    debug?: boolean | undefined;
    debugColor?: Color;
    _debugMesh?: Mesh | undefined;
    _collision?: ((entity: any, other: any, globals?: any) => void) | undefined;
    _destroy?: ((globals?: any) => void) | undefined;
    name?: string | undefined;
    tag?: Set<string> | undefined;
    area?: RigidBody | undefined;
    size?: Vector3;
    radius?: number;
    group: Group;
    body?: RigidBody | undefined;
    bodyDescription: RigidBodyDesc;
    constraintBodies?: RigidBody[] | undefined;
    sensor?: boolean | undefined;
    _enteredZone: Record<string, number>;
    _exitedZone: Record<string, number>;
    _update: (delta: number, options: any) => void;
    _setup: (entity: ZylemZone) => void;
    constructor(options: EntityOptions);
    createBodyDescription(): RigidBodyDesc;
    createCollider(isSensor?: boolean): ColliderDesc;
    createDebugMesh(options: Pick<EntityOptions, 'debugColor' | 'size'>): Mesh<BoxGeometry, MeshPhongMaterial>;
    entered(other: GameEntity<any>): void;
    exited(other: GameEntity<any>): void;
    held(other: GameEntity<any>, delta: number): void;
    setup(entity: ZylemZone): void;
    destroy(): void;
    update(delta: number, options: UpdateOptions<Entity<ZylemZone>>): void;
}
