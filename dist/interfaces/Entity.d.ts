import { ColliderDesc, RigidBody, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { Mesh, Vector3 } from "three";
import { UpdateOptions } from "./Update";
export interface Entity<T = any> {
    setup: (entity: T) => void;
    destroy: () => void;
    update: (delta: number, options: UpdateOptions<Entity<T>>) => void;
    _type: string;
    _collision?: (entity: any, other: any, globals?: any) => void;
    _destroy?: (globals?: any) => void;
    name?: string;
    tag?: Set<string>;
}
export declare abstract class EntityClass<T extends Record<string, any> = any> {
}
export interface EntityBlueprint<T> extends Entity<T> {
    name: string;
    type: GameEntityType;
    props?: {
        [key: string]: any;
    };
    shape?: Vector3;
    collision?: (entity: EntityClass, other: EntityClass) => void;
}
export interface GameEntity<T> extends Entity<T> {
    mesh: Mesh;
    body?: RigidBody;
    bodyDescription: RigidBodyDesc;
    constraintBodies?: RigidBody[];
    createCollider: (isSensor?: boolean) => ColliderDesc;
    _update: (delta: number, options: any) => void;
    _setup: (entity: T) => void;
}
export interface EntityOptions {
    update: (delta: number, options: any) => void;
    setup: (entity: any) => void;
    size?: Vector3;
    radius?: number;
    images?: string[];
}
export declare enum GameEntityType {
    Box = "Box",
    Sphere = "Sphere",
    Sprite = "Sprite"
}
export declare function update(this: GameEntity<EntityClass>, delta: number, { inputs }: any): void;
