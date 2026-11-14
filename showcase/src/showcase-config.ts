/**
 * Showcase exhibit registry.
 *
 * Each exhibit lives at `demos/<id>/<id>.ts` and default-exports a factory
 * returning a {@link ShowcaseDemo}. Helper files whose name differs from their
 * folder, and everything under `demos/_shared/`, are ignored by the
 * folder/filename equality check.
 */
import type { ShowcaseModule } from './demo-types';
import { getDemoRoutePath, normalizePathname } from './router-config';

const allModules = import.meta.glob('./demos/*/*.ts');

export const SECTION_ORDER = [
	'Featured',
	'Stages',
	'Entities',
	'Camera',
	'Actions',
	'Effects',
	'Performance',
] as const;

export type SectionName = (typeof SECTION_ORDER)[number];

/** Sidebar order. An exhibit that is not listed here is not shown. */
const DEMOS_BY_SECTION: Record<SectionName, readonly string[]> = {
	Featured: ['zylem-planet-demo'],
	Stages: ['stage-test'],
	Entities: ['entity-test'],
	Camera: ['camera-test'],
	Actions: ['actions-test'],
	Effects: ['particle-effects'],
	Performance: ['massive-instancing'],
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
		if (!folder || folder !== file) return null;
		const name = folder
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
		return {
			id: folder,
			name,
			routePath: getDemoRoutePath(folder),
			load: load as () => Promise<ShowcaseModule>,
		};
	})
	.filter((entry): entry is Omit<DemoConfig, 'section'> => entry !== null);

const demoMap = new Map(demoEntries.map((entry) => [entry.id, entry]));

export const demoSections: DemoSection[] = SECTION_ORDER.map((sectionName) => ({
	name: sectionName,
	demos: DEMOS_BY_SECTION[sectionName].flatMap((id) => {
		const entry = demoMap.get(id);
		if (!entry) {
			if (import.meta.env.DEV) {
				console.warn(`[showcase-config] Exhibit "${id}" in DEMOS_BY_SECTION was not found.`);
			}
			return [];
		}
		return [{ ...entry, section: sectionName }];
	}),
}));

export const demos: DemoConfig[] = demoSections.flatMap((section) => section.demos);

const demosByRoutePath = new Map(demos.map((demo) => [normalizePathname(demo.routePath), demo]));

export const getDemoByRoutePath = (pathname: string) => {
	return demosByRoutePath.get(normalizePathname(pathname)) ?? null;
};
