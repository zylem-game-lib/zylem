/**
 * STL and mesh PLY. Both three.js loaders return a BufferGeometry.
 * STL is always a triangle soup. PLY without faces is a point cloud.
 */

import {
	BufferGeometry,
	Mesh,
	MeshStandardMaterial,
	Points,
	PointsMaterial,
} from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import type { AssetLoadOptions, ModelLoadResult } from '../asset-types';
import { fetchArrayBuffer } from './fetch-buffer';
import { cloneModelObject } from './model-clone';
import { getUrlFileExtension } from './url-utils';

type ColoredGeometry = BufferGeometry & {
	hasColors?: boolean;
	alpha?: number;
};

function applyUpAxis(object: Mesh | Points, options?: AssetLoadOptions): void {
	if (options?.upAxis === 'z') {
		object.rotation.x = -Math.PI / 2;
	}
}

function standardMaterial(geometry: ColoredGeometry): MeshStandardMaterial {
	const vertexColors = Boolean(geometry.hasColors) || Boolean(geometry.getAttribute('color'));
	const alpha = typeof geometry.alpha === 'number' ? geometry.alpha : 1;
	return new MeshStandardMaterial({
		vertexColors,
		opacity: alpha,
		transparent: alpha < 1,
	});
}

function materialsForGeometry(geometry: ColoredGeometry): MeshStandardMaterial | MeshStandardMaterial[] {
	if (geometry.groups.length > 1) {
		return geometry.groups.map(() => standardMaterial(geometry));
	}
	return standardMaterial(geometry);
}

export function meshResultFromGeometry(
	geometry: BufferGeometry,
	options: AssetLoadOptions | undefined,
	kind: 'mesh' | 'points',
): ModelLoadResult {
	const object = kind === 'points'
		? new Points(geometry, new PointsMaterial({
			size: 1,
			vertexColors: Boolean(geometry.getAttribute('color')),
		}))
		: new Mesh(geometry, materialsForGeometry(geometry));
	applyUpAxis(object, options);
	return { object, animations: [] };
}

export function parseStlBuffer(buffer: ArrayBuffer, options?: AssetLoadOptions): ModelLoadResult {
	const geometry = new STLLoader().parse(buffer);
	return meshResultFromGeometry(geometry, options, 'mesh');
}

export function parseMeshPlyBuffer(buffer: ArrayBuffer, options?: AssetLoadOptions): ModelLoadResult {
	const geometry = new PLYLoader().parse(buffer);
	if (!geometry.getAttribute('normal') && geometry.getIndex()) {
		geometry.computeVertexNormals();
	}
	const kind = geometry.getIndex() ? 'mesh' : 'points';
	return meshResultFromGeometry(geometry, options, kind);
}

export class GeometryMeshAdapter {
	isSupported(url: string): boolean {
		const extension = getUrlFileExtension(url);
		return extension === 'stl' || extension === 'ply';
	}

	async load(url: string, options?: AssetLoadOptions): Promise<ModelLoadResult> {
		const buffer = await fetchArrayBuffer(url, options);
		if (getUrlFileExtension(url) === 'stl') {
			return parseStlBuffer(buffer, options);
		}
		return parseMeshPlyBuffer(buffer, options);
	}

	clone(result: ModelLoadResult): ModelLoadResult {
		return {
			object: cloneModelObject(result.object),
			animations: [],
		};
	}
}
