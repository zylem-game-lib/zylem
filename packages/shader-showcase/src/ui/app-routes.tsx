import type { RouteDefinition } from '@solidjs/router';
import { HOME_ROUTE } from '../router-config';
import { demos } from '../showcase-config';
import Workspace from './Workspace';

export const appRoutes: RouteDefinition[] = [
	{
		path: HOME_ROUTE,
		component: Workspace,
	},
	...demos.map(demo => ({
		path: demo.routePath,
		component: Workspace,
	})),
];
