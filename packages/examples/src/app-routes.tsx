import type { RouteDefinition } from '@solidjs/router';
import { examples } from './examples-config';
import ExampleWorkspace from './ExampleWorkspace';
import { HOME_ROUTE } from './router-config';

export const appRoutes: RouteDefinition[] = [
    {
        path: HOME_ROUTE,
        component: ExampleWorkspace,
    },
    ...examples.map((example) => ({
        path: example.routePath,
        component: ExampleWorkspace,
    })),
];
