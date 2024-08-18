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

export const globalEntities = new Map<number, Entity>();
export const globalSystems: System[] = [];

export const addEntity = (entity: Entity): void => {
    globalEntities.set(entity.uuid, entity);
};

export const addSystem = (system: System): void => {
    globalSystems.push(system);
};

export const updateAllSystems = (): void => {
    globalSystems.forEach(system => {
        system.update(globalEntities);
    });
};
