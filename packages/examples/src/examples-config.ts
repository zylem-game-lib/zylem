import { Game } from "@zylem/game-lib";

export interface ExampleConfig {
  id: string;
  name: string;
  path: string;
  load: () => Promise<any>;
}

// Use Vite's import.meta.glob to find all example files
const demoModules = import.meta.glob('./demos/*.ts');
const stageTestModules = import.meta.glob('./demos/03-stage-test/03-stage-test.ts');

// Combine the globs
const allModules = { ...demoModules, ...stageTestModules };

export type GameModule = {
  default: Game<any>;
};

export const examples: ExampleConfig[] = Object.entries(allModules)
  .map(([path, load]) => {
    // Extract the filename from the path
    // e.g., ./demos/01-basic.ts -> 01-basic
    // e.g., ./demos/03-stage-test/03-stage-test.ts -> 03-stage-test
    const match = path.match(/\/([^\/]+)\.ts$/);
    const id = match ? match[1] : undefined;

    if (!id) return null;

    // Create a readable name from the ID
    // e.g., 01-basic -> Basic
    // e.g., 08-pong -> Pong
    const name = id
      .replace(/^\d+[\.-]?/, '') // Remove leading numbers and separators
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return {
      id,
      name,
      path,
      load: load as () => Promise<GameModule>
    };
  })
  .filter((config): config is ExampleConfig => config !== null)
  .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
