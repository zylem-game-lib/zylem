/** Navigation authoring, baked assets, and runtime path queries. @packageDocumentation */

export {
	createLevelNavigation,
	DEFAULT_NAVIGATION_SETTINGS,
	type LevelNavigation,
	type NavigationAsset,
	type NavigationLink,
	type NavigationObstacle,
	type NavigationPath,
	type NavigationSettings,
	navigationSourceHash,
} from '@zylem/bridge';
export { bakeNavigationData, type NavigationBakeInput } from '../lib/navigation/bake';
export { NavigationMesh } from '../lib/navigation/nav-mesh';
export {
	NavigationSession,
	type NavigationSessionHost,
} from '../lib/navigation/navigation-session';
