/**
 * Stable JSON key for matching prebaked fragment templates to fracture options.
 */

import type { FractureOptions as PinataFractureOptions } from '@dgreenheck/three-pinata';
import { Vector2, Vector3 } from 'three';

function vector2ToTuple(value?: Vector2): [number, number] | null {
	if (!value) {
		return null;
	}

	return [value.x, value.y];
}

function vector3ToTuple(value?: Vector3): [number, number, number] | null {
	if (!value) {
		return null;
	}

	return [value.x, value.y, value.z];
}

/**
 * Serializes fracture options for prebake cache identity (mesh not included).
 */
export function buildFractureGeometryCacheKey(
	options: PinataFractureOptions,
): string {
	return JSON.stringify({
		fractureMethod: options.fractureMethod,
		fragmentCount: options.fragmentCount,
		fracturePlanes: {
			x: options.fracturePlanes?.x ?? true,
			y: options.fracturePlanes?.y ?? true,
			z: options.fracturePlanes?.z ?? true,
		},
		textureScale: vector2ToTuple(options.textureScale),
		textureOffset: vector2ToTuple(options.textureOffset),
		seed: options.seed ?? null,
		voronoiOptions: options.voronoiOptions
			? {
				mode: options.voronoiOptions.mode,
				seedPoints:
					options.voronoiOptions.seedPoints?.map((point) => vector3ToTuple(point)),
				projectionAxis: options.voronoiOptions.projectionAxis ?? null,
				projectionNormal: vector3ToTuple(options.voronoiOptions.projectionNormal),
				useApproximation: options.voronoiOptions.useApproximation ?? false,
				approximationNeighborCount:
					options.voronoiOptions.approximationNeighborCount ?? 12,
			}
			: null,
	});
}
