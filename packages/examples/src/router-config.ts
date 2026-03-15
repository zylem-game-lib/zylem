export const HOME_ROUTE = '/';
export const DEMO_ROUTE_PREFIX = '/demos';

// Override any generated slug here when a demo needs a custom public route.
export const DEMO_ROUTE_SLUGS: Record<string, string> = {
    '00-asteroids': 'asteroids',
    '00-breakout': 'breakout',
    '00-input': 'input',
    '00-jumper-2d': 'jumper-2d',
    '00-physics-worker': 'physics-worker',
    '00-pong': 'pong',
    '00-readme-example': 'readme-example',
    '00-ricochet': 'ricochet',
    '00-ricochet-3d': 'ricochet-3d',
    '00-robotron': 'robotron',
    '00-screen-wrap': 'screen-wrap',
    '00-space-invaders': 'space-invaders',
    '00-stage-test': 'stage-test',
    '00-third-person-test': 'third-person-test',
    '00-zoo': 'zoo',
    '01-fps': 'fps',
    '03-rect': 'rect',
    '03-variable-test': 'variable-test',
    '04-vessel-test': 'vessel-test',
    '05-camera-test': 'camera-test',
    '06-entity-test': 'entity-test',
    '07-actions-test': 'actions-test',
    '08-jumbotron-test': 'jumbotron-test',
    '15-zylem-planet-demo': 'zylem-planet-demo',
    '16-zylem-planet-demo-webGPU': 'zylem-planet-demo-webgpu',
    '17-massive-instancing': 'massive-instancing',
    '17-simple-instancing': 'simple-instancing',
    '17-stress-test': 'stress-test',
    '18-baileys-world': 'baileys-world',
    '20-architecture-test': 'architecture-test',
    '20-basic-ball': 'basic-ball',
    '20-empty-game': 'empty-game',
};

const fallbackDemoRouteSlug = (demoId: string) => {
    return demoId
        .replace(/^\d+[\.-]?/, '')
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
};

export const normalizePathname = (pathname: string) => {
    const normalizedPath = pathname.replace(/\/+$/, '');
    return normalizedPath || HOME_ROUTE;
};

export const getDemoRouteSlug = (demoId: string) => {
    return DEMO_ROUTE_SLUGS[demoId] ?? fallbackDemoRouteSlug(demoId);
};

export const getDemoRoutePath = (demoId: string) => {
    return normalizePathname(`${DEMO_ROUTE_PREFIX}/${getDemoRouteSlug(demoId)}`);
};
