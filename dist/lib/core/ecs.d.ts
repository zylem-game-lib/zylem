export type Component = {};
export type Entity = {
    uuid: number;
    components: Component[];
};
export interface System {
    entities: Map<number, Entity>;
    setup(entities: Map<number, Entity>): void;
    update(entities: Map<number, Entity>): void;
    filter(entity: Entity): boolean;
}
export declare const globalEntities: Map<number, Entity>;
export declare const globalSystems: System[];
export declare const addEntity: (entity: Entity) => void;
export declare const addSystem: (system: System) => void;
export declare const updateAllSystems: () => void;
