/**
 * Web Worker: Voronoi / simple fracture for the Destructible3D behavior prebake.
 *
 * Instantiate with `{ type: 'module' }` and pass the worker URL to the host
 * via `Destructible3DBehaviorOptions.prebakeWorkerUrl` (see the destructible-3d
 * behavior README in @zylem/game-lib for stage-config patterns).
 *
 * Lives in @zylem/utilities (not @zylem/game-lib) so the runtime worker
 * sits alongside the offline prebake CLI as a sibling tool that produces
 * destructible fragment data — the game-lib runtime stays focused on the
 * fracture/repair behavior itself.
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
} from '@zylem/behaviors/destructible-prebake';

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
