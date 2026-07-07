/**
 * Showcase demo registry.
 *
 * Follows the examples-app pattern: each demo lives at
 * `demos/<demo-name>/<demo-name>.ts` and default-exports a factory returning
 * a {@link ShowcaseDemo}. Helper files whose name differs from their folder
 * are ignored by the folder/filename equality check.
 */
import type { ShowcaseModule } from './demo-types';
import { getDemoRoutePath, normalizePathname } from './router-config';

const allModules = import.meta.glob('./demos/*/*.ts');

export const SECTION_ORDER = [
	'Backgrounds',
	'Surface Materials',
	'Shadertoy',
	'Postprocessing',
	'Transitions',
] as const;

export type SectionName = (typeof SECTION_ORDER)[number];

const SECTION_BY_DEMO: Record<SectionName, readonly string[]> = {
	Backgrounds: ['magical-landscape', 'starry-night', 'alien-sky'],
	'Surface Materials': [
		'water-surface',
		'lava',
		'ringed-planet',
		'energy-shield',
		'dissolve',
		'arcade-dissolve',
		'foliage',
		'holographic',
	],
	Shadertoy: ['shadertoy-gallery'],
	Postprocessing: ['afterimage', 'vhs-grain', 'pixelation', 'retro'],
	Transitions: ['stage-transition'],
};

export interface DemoConfig {
	id: string;
	name: string;
	section: SectionName;
	routePath: string;
	load: () => Promise<ShowcaseModule>;
}

export interface DemoSection {
	name: SectionName;
	demos: DemoConfig[];
}

const demoEntries = Object.entries(allModules)
	.map(([path, load]) => {
		const match = path.match(/\/([^/]+)\/([^/]+)\.ts$/);
		if (!match) return null;
		const [, folder, file] = match;
		if (folder !== file) return null;
		const id = folder as string;
		const name = id
			.split('-')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
		return {
			id,
			name,
			routePath: getDemoRoutePath(id),
			load: load as () => Promise<ShowcaseModule>,
		};
	})
	.filter((entry): entry is Omit<DemoConfig, 'section'> => entry !== null);

const demoMap = new Map(demoEntries.map(entry => [entry.id, entry]));

export const demoSections: DemoSection[] = SECTION_ORDER.map(sectionName => ({
	name: sectionName,
	demos: SECTION_BY_DEMO[sectionName]
		.map(id => {
			const entry = demoMap.get(id);
			return entry ? { ...entry, section: sectionName } : null;
		})
		.filter((demo): demo is DemoConfig => demo !== null),
}));

export const demos: DemoConfig[] = demoSections.flatMap(section => section.demos);

const demosByRoutePath = new Map(
	demos.map(demo => [normalizePathname(demo.routePath), demo]),
);

export const getDemoByRoutePath = (pathname: string) => {
	return demosByRoutePath.get(normalizePathname(pathname)) ?? null;
};
