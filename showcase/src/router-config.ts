export const HOME_ROUTE = '/';
export const DEMO_ROUTE_PREFIX = '/demos';

export const normalizePathname = (pathname: string) => {
	const normalizedPath = pathname.replace(/\/+$/, '');
	return normalizedPath || HOME_ROUTE;
};

export const getDemoRoutePath = (demoId: string) => {
	return normalizePathname(`${DEMO_ROUTE_PREFIX}/${demoId.toLowerCase()}`);
};
