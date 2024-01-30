export type Constructor = new (...args: any[]) => {};

export function applyComposition<T>(composition: any[] = [], base: T) {
	return composition.reduce((accumulation, component) => component(accumulation), base);
}