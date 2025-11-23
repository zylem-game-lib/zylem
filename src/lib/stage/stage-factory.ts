import { StageBlueprint } from '../core/blueprints';
import { createStage, Stage } from './stage';
import { EntityFactory } from '../entities/entity-factory';

export const StageFactory = {
  async createFromBlueprint(blueprint: StageBlueprint): Promise<Stage> {
    // Create a new Stage instance
    // We might need to pass options from blueprint if StageSchema has them
    const stage = createStage({
        // Map blueprint properties to stage options if needed
        // e.g. name: blueprint.name
    });
    
    // Assign ID if possible, though Stage might generate its own UUID.
    // If we want to track it by blueprint ID, we might need to store it on the stage.
    // stage.id = blueprint.id; // Stage doesn't have public ID setter easily maybe?

    if (blueprint.entities) {
      for (const entityBlueprint of blueprint.entities) {
        try {
          const entity = await EntityFactory.createFromBlueprint(entityBlueprint);
          stage.add(entity);
        } catch (e) {
          console.error(`Failed to create entity ${entityBlueprint.id} for stage ${blueprint.id}`, e);
        }
      }
    }

    return stage;
  }
};
