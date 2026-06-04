/**
 * Serializable payloads for destructible Voronoi prebake in a Web Worker.
 */

import { FractureOptions, type DestructibleMesh } from '@dgreenheck/three-pinata';
import {
	BufferAttribute,
	BufferGeometry,
	Quaternion,
	Vector2,
	Vector3,
} from 'three';

export interface PlainBufferGeometryPayload {
	attributes: Record<
		string,
		{
			array: ArrayBuffer;
			itemSize: number;
			normalized?: boolean;
		}
	>;
}

export type PlainFractureOptions = {
	fractureMethod: 'voronoi' | 'simple';
	fragmentCount: number;
	fracturePlanes: { x: boolean; y: boolean; z: boolean };
	textureScale: [number, number];
	textureOffset: [number, number];
	seed?: number;
	voronoiOptions?: {
		mode: '3D' | '2.5D';
		seedPoints?: [number, number, number][];
		impactPoint?: [number, number, number];
		impactRadius?: number;
		projectionAxis?: 'x' | 'y' | 'z' | 'auto' | null;
		projectionNormal?: [number, number, number];
		useApproximation: boolean;
		approximationNeighborCount: number;
	};
};

export type PlainWorkerFragmentPayload = {
	attributes: PlainBufferGeometryPayload['attributes'];
	position: [number, number, number];
	quaternion: [number, number, number, number];
	scale: [number, number, number];
};

export type PrebakeWorkerRequest = {
	geometry: PlainBufferGeometryPayload;
	options: PlainFractureOptions;
};

export type PrebakeWorkerResponse = {
	fragments: PlainWorkerFragmentPayload[];
};

export interface DestructiblePrebakeWorkerAPI {
	prebake(request: PrebakeWorkerRequest): Promise<PrebakeWorkerResponse>;
}

/**
 * Copies a buffer geometry into detached ArrayBuffers suitable for postMessage transfer.
 */
export function bufferGeometryToPlain(geometry: BufferGeometry): {
	payload: PlainBufferGeometryPayload;
	transferables: ArrayBuffer[];
} {
	const attributes: PlainBufferGeometryPayload['attributes'] = {};
	const transferables: ArrayBuffer[] = [];

	for (const name of Object.keys(geometry.attributes)) {
		const attr = geometry.getAttribute(name);
		if (!attr || !(attr instanceof BufferAttribute)) {
			continue;
		}
		const view = attr.array as ArrayBufferView;
		const buffer = view.buffer.slice(
			view.byteOffset,
			view.byteOffset + view.byteLength,
		);
		transferables.push(buffer);
		attributes[name] = {
			array: buffer,
			itemSize: attr.itemSize,
			normalized: attr.normalized,
		};
	}

	return { payload: { attributes }, transferables };
}

/**
 * Rebuilds a BufferGeometry from a plain payload (e.g. in a worker).
 */
export function plainToBufferGeometry(
	payload: PlainBufferGeometryPayload,
): BufferGeometry {
	const geometry = new BufferGeometry();

	for (const [name, spec] of Object.entries(payload.attributes)) {
		const array = new Float32Array(spec.array);
		geometry.setAttribute(
			name,
			new BufferAttribute(array, spec.itemSize, spec.normalized),
		);
	}

	return geometry;
}

/**
 * Serializes {@link FractureOptions} for structured clone / worker transfer.
 */
export function pinataFractureOptionsToPlain(
	options: FractureOptions,
): PlainFractureOptions {
	const voronoi = options.voronoiOptions;
	return {
		fractureMethod: options.fractureMethod,
		fragmentCount: options.fragmentCount,
		fracturePlanes: {
			x: options.fracturePlanes.x,
			y: options.fracturePlanes.y,
			z: options.fracturePlanes.z,
		},
		textureScale: [options.textureScale.x, options.textureScale.y],
		textureOffset: [options.textureOffset.x, options.textureOffset.y],
		seed: options.seed,
		voronoiOptions: voronoi
			? {
				mode: voronoi.mode,
				seedPoints: voronoi.seedPoints?.map((p) => [p.x, p.y, p.z]),
				impactPoint: voronoi.impactPoint
					? [voronoi.impactPoint.x, voronoi.impactPoint.y, voronoi.impactPoint.z]
					: undefined,
				impactRadius: voronoi.impactRadius,
				projectionAxis: voronoi.projectionAxis ?? null,
				projectionNormal: voronoi.projectionNormal
					? [
						voronoi.projectionNormal.x,
						voronoi.projectionNormal.y,
						voronoi.projectionNormal.z,
					]
					: undefined,
				useApproximation: voronoi.useApproximation ?? false,
				approximationNeighborCount:
					voronoi.approximationNeighborCount ?? 12,
			}
			: undefined,
	};
}

/**
 * Reconstructs {@link FractureOptions} from a plain payload.
 */
export function plainFractureOptionsToPinata(
	plain: PlainFractureOptions,
): FractureOptions {
	return new FractureOptions({
		fractureMethod: plain.fractureMethod,
		fragmentCount: plain.fragmentCount,
		fracturePlanes: plain.fracturePlanes,
		textureScale: new Vector2(plain.textureScale[0], plain.textureScale[1]),
		textureOffset: new Vector2(plain.textureOffset[0], plain.textureOffset[1]),
		seed: plain.seed,
		voronoiOptions: plain.voronoiOptions
			? {
				mode: plain.voronoiOptions.mode,
				seedPoints: plain.voronoiOptions.seedPoints?.map(
					([x, y, z]) => new Vector3(x, y, z),
				),
				impactPoint: plain.voronoiOptions.impactPoint
					? new Vector3(
						plain.voronoiOptions.impactPoint[0],
						plain.voronoiOptions.impactPoint[1],
						plain.voronoiOptions.impactPoint[2],
					)
					: undefined,
				impactRadius: plain.voronoiOptions.impactRadius,
				projectionAxis:
					plain.voronoiOptions.projectionAxis === null
						? undefined
						: plain.voronoiOptions.projectionAxis ?? undefined,
				projectionNormal: plain.voronoiOptions.projectionNormal
					? new Vector3(
						plain.voronoiOptions.projectionNormal[0],
						plain.voronoiOptions.projectionNormal[1],
						plain.voronoiOptions.projectionNormal[2],
					)
					: undefined,
				useApproximation: plain.voronoiOptions.useApproximation,
				approximationNeighborCount:
					plain.voronoiOptions.approximationNeighborCount,
			}
			: undefined,
	});
}

/**
 * Converts worker response fragments into template parts for the main-thread cache.
 */
export function plainWorkerResultToTemplateParts(response: PrebakeWorkerResponse): Array<{
	geometry: BufferGeometry;
	position: Vector3;
	quaternion: Quaternion;
	scale: Vector3;
}> {
	return response.fragments.map((fragment) => {
		const geometry = plainToBufferGeometry({ attributes: fragment.attributes });
		geometry.computeBoundingBox();
		geometry.computeBoundingSphere();
		return {
			geometry,
			position: new Vector3(
				fragment.position[0],
				fragment.position[1],
				fragment.position[2],
			),
			quaternion: new Quaternion(
				fragment.quaternion[0],
				fragment.quaternion[1],
				fragment.quaternion[2],
				fragment.quaternion[3],
			),
			scale: new Vector3(
				fragment.scale[0],
				fragment.scale[1],
				fragment.scale[2],
			),
		};
	});
}

/**
 * Serializes fracture fragments for Comlink.transfer (used in the worker).
 */
export function destructibleFragmentsToPlainResponse(
	fragments: readonly DestructibleMesh[],
): {
	response: PrebakeWorkerResponse;
	transferables: ArrayBuffer[];
} {
	const out: PlainWorkerFragmentPayload[] = [];
	const transferables: ArrayBuffer[] = [];

	for (const fragment of fragments) {
		const { payload, transferables: geoTransfer } = bufferGeometryToPlain(
			fragment.geometry,
		);
		for (const buffer of geoTransfer) {
			transferables.push(buffer);
		}
		out.push({
			attributes: payload.attributes,
			position: [fragment.position.x, fragment.position.y, fragment.position.z],
			quaternion: [
				fragment.quaternion.x,
				fragment.quaternion.y,
				fragment.quaternion.z,
				fragment.quaternion.w,
			],
			scale: [fragment.scale.x, fragment.scale.y, fragment.scale.z],
		});
		fragment.geometry.dispose();
	}

	return { response: { fragments: out }, transferables };
}
