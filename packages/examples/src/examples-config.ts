import { Game } from '@zylem/game-lib/core';
import {
	getDemoRoutePath,
	getDemoRouteSlug,
	normalizePathname,
} from './router-config';

// Each demo lives at `demos/<demo-name>/<demo-name>.ts`. Helper files such as
// `demos/<demo-name>/<helper>.ts` and shared modules under `demos/_shared/`
// are intentionally not picked up; we only want top-level demo entrypoints.
// (`_shared` is excluded by the leading-underscore folder name.)
const allModules = import.meta.glob('./demos/*/*.ts');

export type GameModule = {
	default: () => Game<any>;
};

export const EXAMPLE_SECTION_ORDER = [
	'Game Demos',
	'Tech Demos',
	'Classic Remakes',
	'Basic',
	'Advanced',
	'Misc',
] as const;

export type ExampleSectionName = (typeof EXAMPLE_SECTION_ORDER)[number];

export interface ExampleConfig {
	id: string;
	name: string;
	path: string;
	section: ExampleSectionName;
	routeSlug: string;
	routePath: string;
	load: () => Promise<GameModule>;
}

export interface ExampleSection {
	name: ExampleSectionName;
	examples: ExampleConfig[];
}

type UnsectionedExampleConfig = Omit<ExampleConfig, 'section'>;

// Define the sections and the order of demos within each section.
// Any demos omitted here fall back to the Misc section alphabetically.
const PREDEFINED_ORDER = {
	Basic: [
		'readme-example',
		'input',
		'rect',
		'variable-test',
		'empty-game',
		'basic-ball',
		'virtual-touch-ball',
	],
	Advanced: [
		'stage-test',
		'fps',
		'vessel-test',
		'camera-test',
		'entity-test',
		'actions-test',
		'jumbotron-test',
		'destructible-behavior',
		'particle-effects',
		'zylem-planet-demo',
		'zylem-planet-demo-webgpu',
		'simple-instancing',
		'massive-instancing',
		'stress-test',
		'architecture-test',
	],
	'Game Demos': [
		'arena',
		'3d-asteroids',
		'3d-space-invaders',
	],
	'Tech Demos': [
		'ricochet',
		'ricochet-3d',
		'jumper-2d',
		'screen-wrap',
		'third-person-test',
		'zoo',
		'multiplayer-lobby',
	],
	'Classic Remakes': [
		'pong',
		'breakout',
		'space-invaders',
		'asteroids',
		'robotron',
	],
	Misc: [
		'optimized-destructible-ship',
		'physics-worker',
		'baileys-world',
	],
} as const satisfies Record<ExampleSectionName, readonly string[]>;

// Create a map of all examples
const allExamples = Object.entries(allModules)
	.map(([path, load]) => {
		// Only accept demos where the folder name matches the file name, e.g.
		//   ./demos/arena/arena.ts                 -> id: 'arena'
		//   ./demos/3d-asteroids/3d-asteroids.ts   -> id: '3d-asteroids'
		// Helper files like `./demos/arena/main-stage/...` aren't matched by
		// the glob (it's only one level deep), but sibling helpers like
		// `./demos/multiplayer-lobby/multiplayer-lobby-store.ts` would be —
		// the folder/filename equality check filters them out.
		const match = path.match(/\/([^/]+)\/([^/]+)\.ts$/);
		if (!match) return null;
		const [, folder, file] = match;
		if (folder !== file) return null;
		const id = folder!;

		// Create a readable name from the ID
		// e.g., basic -> Basic, 3d-asteroids -> 3d Asteroids
		const name = id
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
		const routeSlug = getDemoRouteSlug(id);
		const routePath = getDemoRoutePath(id);

		return {
			id,
			name,
			path,
			routeSlug,
			routePath,
			load: load as () => Promise<GameModule>
		};
	})
	.filter((config): config is UnsectionedExampleConfig => config !== null);

// Create a map for quick lookup
const examplesMap = new Map(allExamples.map(ex => [ex.id, ex]));
const assignedExampleIds = new Set<string>();

const warnInvalidSectionConfig = (message: string) => {
	if (import.meta.env.DEV) {
		console.warn(message);
	}
};

const assignExampleToSection = (
	id: string,
	section: ExampleSectionName
): ExampleConfig | null => {
	if (assignedExampleIds.has(id)) {
		warnInvalidSectionConfig(
			`[examples-config] Duplicate demo id "${id}" in PREDEFINED_ORDER.`
		);
		return null;
	}

	const example = examplesMap.get(id);
	if (!example) {
		warnInvalidSectionConfig(
			`[examples-config] Demo id "${id}" in PREDEFINED_ORDER was not found.`
		);
		return null;
	}

	assignedExampleIds.add(id);
	return { ...example, section };
};

export const exampleSections: ExampleSection[] = EXAMPLE_SECTION_ORDER.map(
	(sectionName) => {
		const configuredExamples = PREDEFINED_ORDER[sectionName]
			.map((id) => assignExampleToSection(id, sectionName))
			.filter((example): example is ExampleConfig => example !== null);

		const unassignedExamples =
			sectionName === 'Misc'
				? allExamples
					.filter((example) => !assignedExampleIds.has(example.id))
					.sort((a, b) =>
						a.id.localeCompare(b.id, undefined, { numeric: true })
					)
					.map((example) => ({ ...example, section: sectionName }))
				: [];

		return {
			name: sectionName,
			examples: [...configuredExamples, ...unassignedExamples],
		};
	}
);

export const examples: ExampleConfig[] = exampleSections.flatMap(
	(section) => section.examples
);

const examplesByRoutePath = new Map(
	examples.map((example) => [normalizePathname(example.routePath), example])
);

export const getExampleByRoutePath = (pathname: string) => {
	return examplesByRoutePath.get(normalizePathname(pathname)) ?? null;
};
