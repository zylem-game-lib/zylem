export const HOME_ROUTE = '/';
export const DEMO_ROUTE_PREFIX = '/demos';

/**
 * Demo ids are already slug-shaped (e.g. `arena`, `multiplayer-lobby`,
 * `3d-asteroids`, `zylem-planet-demo-webgpu`) since the demo folder names
 * mirror the public route slug, so we just normalise to lowercase here.
 *
 * If a demo ever needs a slug that diverges from its folder name, override
 * it via a small map in this module rather than reintroducing prefixes.
 */
const fallbackDemoRouteSlug = (demoId: string) => {
    return demoId
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
    return fallbackDemoRouteSlug(demoId);
};

export const getDemoRoutePath = (demoId: string) => {
    return normalizePathname(`${DEMO_ROUTE_PREFIX}/${getDemoRouteSlug(demoId)}`);
};
