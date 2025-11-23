import { EntityBlueprint } from '../core/blueprints';
import { GameEntity } from './entity';
type EntityCreator = (options: any) => Promise<GameEntity<any>>;
export declare const EntityFactory: {
    registry: Map<string, EntityCreator>;
    register(type: string, creator: EntityCreator): void;
    createFromBlueprint(blueprint: EntityBlueprint): Promise<GameEntity<any>>;
};
export {};
//# sourceMappingURL=entity-factory.d.ts.map