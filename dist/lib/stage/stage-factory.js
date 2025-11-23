import { createStage as a } from "./stage.js";
import { EntityFactory as i } from "../entities/entity-factory.js";
const s = {
  async createFromBlueprint(t) {
    const r = a({
      // Map blueprint properties to stage options if needed
      // e.g. name: blueprint.name
    });
    if (t.entities)
      for (const o of t.entities)
        try {
          const e = await i.createFromBlueprint(o);
          r.add(e);
        } catch (e) {
          console.error(`Failed to create entity ${o.id} for stage ${t.id}`, e);
        }
    return r;
  }
};
export {
  s as StageFactory
};
