/**
 * Build-time / Node helpers for destructible Voronoi prebake (shared with runtime worker payloads).
 */

export {
	buildNormalizedFractureSourceGeometry,
	normalizeFractureSourceGeometry,
} from './destructible-prebake-source-geometry';
export { buildFractureGeometryCacheKey } from './destructible-prebake-cache-key';
export {
	bufferGeometryToPlain,
	destructibleFragmentsToPlainResponse,
	pinataFractureOptionsToPlain,
	plainFractureOptionsToPinata,
} from './destructible-prebake-payload';
export type {
	PlainFractureOptions,
	PlainWorkerFragmentPayload,
	PrebakeWorkerRequest,
	PrebakeWorkerResponse,
} from './destructible-prebake-payload';
