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

// Define the predefined order for specific examples
// Examples not in this list will be sorted alphabetically after these
const PREDEFINED_ORDER = [
  '00-readme-example',
  '00-screen-wrap',
  '00-input',
  '00-pong',
  '00-breakout',
  '00-space-invaders',
  '00-third-person-test',
  // 'stage-test/00-stage-test',
];

// Create a map of all examples
const allExamples = Object.entries(allModules)
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
  .filter((config): config is ExampleConfig => config !== null);

// Create a map for quick lookup
const examplesMap = new Map(allExamples.map(ex => [ex.id, ex]));
console.log(examplesMap);
// Separate predefined examples (in order) and remaining examples (alphabetically sorted)
const predefinedExamples = PREDEFINED_ORDER
  .map(id => examplesMap.get(id))
  .filter((config): config is ExampleConfig => config !== undefined);

const remainingExamples = allExamples
  .filter(ex => !PREDEFINED_ORDER.includes(ex.id))
  .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

// Combine predefined examples first, then alphabetically sorted remaining examples
export const examples: ExampleConfig[] = [...predefinedExamples, ...remainingExamples];
