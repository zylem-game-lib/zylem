import { Game } from '@zylem/game-lib';
import {
	getDemoRoutePath,
	getDemoRouteSlug,
	normalizePathname,
} from './router-config';

// Only load top-level demo entrypoints; helper files in `src/demos` should not
// appear as standalone examples in the viewer.
const demoModules = import.meta.glob('./demos/[0-9][0-9]-*.ts');
const stageTestModules = import.meta.glob('./demos/03-stage-test/03-stage-test.ts');

// Combine the globs
const allModules = { ...demoModules, ...stageTestModules };

export type GameModule = {
	default: () => Game<any>;
};

export const EXAMPLE_SECTION_ORDER = [
	'Classic Remakes',
	'Basic',
	'Advanced',
	'Game Demos',
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
		'00-readme-example',
		'00-input',
		'03-rect',
		'03-variable-test',
		'20-empty-game',
		'20-basic-ball',
		'20-virtual-touch-ball',
	],
	Advanced: [
		'00-stage-test',
		'01-fps',
		'04-vessel-test',
		'05-camera-test',
		'06-entity-test',
		'07-actions-test',
		'08-jumbotron-test',
		'09-destructible-behavior',
		'10-particle-effects',
		'15-zylem-planet-demo',
		'16-zylem-planet-demo-webGPU',
		'17-simple-instancing',
		'17-massive-instancing',
		'17-stress-test',
		'20-architecture-test',
	],
	'Game Demos': [
		'00-ricochet',
		'00-ricochet-3d',
		'00-jumper-2d',
		'00-screen-wrap',
		'00-third-person-test',
		'00-four-characters-plane',
		'00-arena',
		'00-zoo',
		'18-baileys-world',
	],
	'Classic Remakes': [
		'00-3d-asteroids',
		'00-3d-space-invaders',
		'00-pong',
		'00-breakout',
		'00-space-invaders',
		'00-asteroids',
		'00-robotron',
	],
	Misc: [
		'00-optimized-destructible-ship',
		'00-optimized-ships-ab',
		'00-optimized-ships',
		'00-physics-worker',
	],
} as const satisfies Record<ExampleSectionName, readonly string[]>;

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
