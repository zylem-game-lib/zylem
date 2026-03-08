import { EntityBlueprint } from '../core/blueprints';
import { GameEntity, GameEntityOptions } from './entity';
import { createText } from './text';
import { createSprite } from './sprite';

type EntityCreator = (options: any) => GameEntity<any>;

export const EntityFactory = {
  registry: new Map<string, EntityCreator>(),

  register(type: string, creator: EntityCreator) {
    this.registry.set(type, creator);
  },

  createFromBlueprint(blueprint: EntityBlueprint): GameEntity<any> {
    const creator = this.registry.get(blueprint.type);
    if (!creator) {
      throw new Error(`Unknown entity type: ${blueprint.type}`);
    }

    const options: GameEntityOptions = {
      ...blueprint.data,
      position: blueprint.position ? { x: blueprint.position[0], y: blueprint.position[1], z: 0 } : undefined,
      name: blueprint.id,
    };

    const entity = creator(options);
    
    return entity;
  }
};

EntityFactory.register('text', (opts) => createText(opts) as unknown as GameEntity<any>);
EntityFactory.register('sprite', (opts) => createSprite(opts) as unknown as GameEntity<any>);

/**
 * Factory interface for generating entity copies
 */
export interface TemplateFactory<E extends GameEntity<O>, O extends GameEntityOptions = GameEntityOptions> {
	/** The template entity used for cloning */
	readonly template: E;
	
	/**
	 * Generate multiple copies of the template entity
	 * @param count Number of copies to generate
	 * @returns Array of new entity instances
	 */
	generate(count: number): E[];
}

/**
 * Create an entity factory from a template entity.
 * 
 * @param template The entity to use as a template for cloning
 * @returns Factory object with generate() method
 * 
 * @example
 * ```typescript
 * const asteroidTemplate = createSprite({ images: [{ name: 'asteroid', file: asteroidImg }] });
 * const asteroidFactory = createEntityFactory(asteroidTemplate);
 * const asteroids = asteroidFactory.generate(10);
 * 
 * asteroids.forEach((asteroid, i) => {
 *     asteroid.setPosition(Math.random() * 20 - 10, Math.random() * 15 - 7.5, 0);
 *     stage.add(asteroid);
 * });
 * ```
 */
export function createEntityFactory<E extends GameEntity<O>, O extends GameEntityOptions = GameEntityOptions>(
	template: E
): TemplateFactory<E, O> {
	return {
		template,
		
		generate(count: number): E[] {
			const entities: E[] = [];
			
			for (let i = 0; i < count; i++) {
				entities.push(template.clone());
			}
			
			return entities;
		}
	};
}
