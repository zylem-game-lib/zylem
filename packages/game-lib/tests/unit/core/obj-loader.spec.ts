import { Mesh, MeshPhongMaterial } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { OBJLoaderAdapter } from '../../../src/lib/core/loaders/obj-loader';

const RED_OBJ = `mtllib red.mtl
v 0 0 0
v 1 0 0
v 0 1 0
usemtl Red
f 1 2 3
`;

const UNPAINTED_OBJ = `v 0 0 0
v 1 0 0
v 0 1 0
usemtl Red
f 1 2 3
`;

const RED_MTL = `newmtl Red
Kd 1 0 0
`;

function materialColor(object: { children: Array<{ material?: unknown }> }): MeshPhongMaterial {
	const mesh = object.children[0] as Mesh;
	const material = mesh.material;
	return (Array.isArray(material) ? material[0] : material) as MeshPhongMaterial;
}

describe('OBJLoaderAdapter', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('loads a sibling MTL and does not reuse it for the next OBJ', async () => {
		const files = new Map<string, string>([
			['/models/red.obj', RED_OBJ],
			['/models/red.mtl', RED_MTL],
			['/models/plain.obj', UNPAINTED_OBJ],
		]);
		const fetchMock = vi.fn(async (url: string) => {
			const body = files.get(String(url));
			if (body === undefined) {
				return new Response('missing', { status: 404 });
			}
			return new Response(body);
		});
		vi.stubGlobal('fetch', fetchMock);

		const loader = new OBJLoaderAdapter();
		const painted = await loader.load('/models/red.obj');
		const plain = await loader.load('/models/plain.obj');

		expect(fetchMock.mock.calls.map((call) => String(call[0]))).toContain('/models/red.mtl');
		expect(materialColor(painted.object as Mesh).color.r).toBeCloseTo(1, 5);
		expect(materialColor(painted.object as Mesh).color.g).toBeCloseTo(0, 5);
		expect(materialColor(plain.object as Mesh).color.g).toBeGreaterThan(0.5);
	});
});
