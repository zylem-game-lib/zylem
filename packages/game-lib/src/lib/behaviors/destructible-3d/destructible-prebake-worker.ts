/**
 * Web Worker: Voronoi / simple fracture for {@link Destructible3DBehavior} prebake.
 *
 * Instantiate with `{ type: 'module' }` and expose URL to the host (see package README / stage config patterns).
 */

import * as Comlink from 'comlink';
import { DestructibleMesh } from '@dgreenheck/three-pinata';
import { MeshBasicMaterial } from 'three';

import {
	destructibleFragmentsToPlainResponse,
	plainFractureOptionsToPinata,
	plainToBufferGeometry,
	type PrebakeWorkerRequest,
	type PrebakeWorkerResponse,
} from './destructible-prebake-payload';

const outerMaterial = new MeshBasicMaterial();
const innerMaterial = new MeshBasicMaterial();

const api = {
	prebake(request: PrebakeWorkerRequest): PrebakeWorkerResponse {
		const geometry = plainToBufferGeometry(request.geometry);
		const fractureOptions = plainFractureOptionsToPinata(request.options);
		const source = new DestructibleMesh(geometry, outerMaterial, innerMaterial);
		let fragments: DestructibleMesh[];
		try {
			fragments = source.fracture(fractureOptions);
		} finally {
			source.geometry.dispose();
		}

		const { response, transferables } =
			destructibleFragmentsToPlainResponse(fragments);
		return Comlink.transfer(response, transferables);
	},
};

Comlink.expose(api);
