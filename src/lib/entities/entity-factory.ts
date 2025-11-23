import { EntityBlueprint } from '../core/blueprints';
import { GameEntity, GameEntityOptions } from './entity';
import { text } from './text';
import { sprite } from './sprite';

type EntityCreator = (options: any) => Promise<GameEntity<any>>;

export const EntityFactory = {
  registry: new Map<string, EntityCreator>(),

  register(type: string, creator: EntityCreator) {
    this.registry.set(type, creator);
  },

  async createFromBlueprint(blueprint: EntityBlueprint): Promise<GameEntity<any>> {
    const creator = this.registry.get(blueprint.type);
    if (!creator) {
      throw new Error(`Unknown entity type: ${blueprint.type}`);
    }

    const options: GameEntityOptions = {
      ...blueprint.data,
      position: blueprint.position ? { x: blueprint.position[0], y: blueprint.position[1], z: 0 } : undefined,
      name: blueprint.id,
    };

    const entity = await creator(options);
    
    return entity;
  }
};

EntityFactory.register('text', async (opts) => await text(opts) as unknown as GameEntity<any>);
EntityFactory.register('sprite', async (opts) => await sprite(opts) as unknown as GameEntity<any>);
