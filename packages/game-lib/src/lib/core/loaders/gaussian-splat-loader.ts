/**
 * One drawable for every Gaussian format three.js r187 already decodes:
 * PLY (splat), SPZ, SPLAT, and KSPLAT. The scene object is `GaussianSplat`.
 */

import { BufferGeometry } from 'three';
import { GaussianSplat } from 'three/addons/objects/GaussianSplat.js';
import { GaussianSplatPLYLoader } from 'three/addons/loaders/GaussianSplatPLYLoader.js';
import { KSPLATLoader } from 'three/addons/loaders/KSPLATLoader.js';
import { SPLATLoader } from 'three/addons/loaders/SPLATLoader.js';
import { SPZLoader } from 'three/addons/loaders/SPZLoader.js';
import type { AssetLoadOptions, ModelLoadResult } from '../asset-types';
import { fetchArrayBuffer } from './fetch-buffer';
import {
	GAUSSIAN_SPLAT_ASSET_KIND,
	ZYLEM_ASSET_KIND_KEY,
} from './gaussian-model';
import { cloneModelObject } from './model-clone';
import { MAX_GAUSSIAN_SPLATS } from './model-sniff';
import { getUrlFileExtension } from './url-utils';

export type GaussianContainer = 'spz' | 'splat' | 'ksplat' | 'ply';

function splatCount(geometry: BufferGeometry): number {
	return geometry.getAttribute('position')?.count ?? 0;
}

export function createGaussianSplatResult(
	geometry: BufferGeometry,
	options?: AssetLoadOptions,
): ModelLoadResult {
	const count = splatCount(geometry);
	if (count > MAX_GAUSSIAN_SPLATS) {
		geometry.dispose();
		throw new Error(
			`Gaussian splat has ${count} splats, which exceeds the limit of ${MAX_GAUSSIAN_SPLATS}.`,
		);
	}

	const splat = new GaussianSplat(geometry);
	splat.userData[ZYLEM_ASSET_KIND_KEY] = GAUSSIAN_SPLAT_ASSET_KIND;
	if (options?.splatFrame === 'y-down') {
		splat.rotation.x = Math.PI;
	}
	return { object: splat, animations: [] };
}

async function geometryFromParsed(parsed: BufferGeometry | Promise<BufferGeometry> | undefined): Promise<BufferGeometry> {
	if (!parsed) {
		throw new Error('Gaussian splat parser returned no geometry.');
	}
	return parsed instanceof Promise ? parsed : parsed;
}

export async function parseGaussianBuffer(
	kind: GaussianContainer,
	buffer: ArrayBuffer,
): Promise<BufferGeometry> {
	switch (kind) {
		case 'spz': {
			const loader = new SPZLoader();
			return new Promise((resolve, reject) => {
				let settled = false;
				const finish = (geometry: BufferGeometry) => {
					if (settled) return;
					settled = true;
					resolve(geometry);
				};
				const fail = (error: unknown) => {
					if (settled) return;
					settled = true;
					reject(error instanceof Error ? error : new Error(String(error)));
				};
				try {
					const parsed = loader.parse(buffer, finish, fail);
					if (parsed && typeof (parsed as Promise<BufferGeometry>).then === 'function') {
						(parsed as Promise<BufferGeometry>).then(finish, fail);
					} else if (parsed) {
						finish(parsed as BufferGeometry);
					}
				} catch (error) {
					fail(error);
				}
			});
		}
		case 'splat':
			return new SPLATLoader().parse(buffer);
		case 'ksplat':
			return geometryFromParsed(new KSPLATLoader().parse(buffer) as BufferGeometry | Promise<BufferGeometry>);
		case 'ply':
			return new GaussianSplatPLYLoader().parse(buffer);
		default:
			throw new Error(`Unsupported Gaussian splat container: ${kind}`);
	}
}

export class GaussianSplatAdapter {
	isSupported(url: string): boolean {
		const extension = getUrlFileExtension(url);
		return extension === 'spz' || extension === 'splat' || extension === 'ksplat' || extension === 'ply';
	}

	async load(url: string, options?: AssetLoadOptions): Promise<ModelLoadResult> {
		const buffer = await fetchArrayBuffer(url, options);
		const extension = getUrlFileExtension(url);
		const kind: GaussianContainer = extension === 'ply' ? 'ply' : extension as GaussianContainer;
		return this.parse(kind, buffer, options);
	}

	async parse(
		kind: GaussianContainer,
		buffer: ArrayBuffer,
		options?: AssetLoadOptions,
	): Promise<ModelLoadResult> {
		const geometry = await parseGaussianBuffer(kind, buffer);
		return createGaussianSplatResult(geometry, options);
	}

	clone(result: ModelLoadResult): ModelLoadResult {
		return {
			object: cloneModelObject(result.object),
			animations: [],
		};
	}
}
