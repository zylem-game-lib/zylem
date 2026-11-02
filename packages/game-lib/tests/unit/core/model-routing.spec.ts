import { Group, Mesh } from 'three';
import { zipSync } from 'three/addons/libs/fflate.module.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AssetManager } from '../../../src/lib/core/asset-manager';
import { ALEMBIC_UNSUPPORTED_MESSAGE } from '../../../src/lib/core/loaders/model-sniff';

const TRIANGLE_USDA = `#usda 1.0
(
    defaultPrim = "World"
    metersPerUnit = 1
    upAxis = "Y"
)

def Xform "World"
{
    def Mesh "Triangle"
    {
        int[] faceVertexCounts = [3]
        int[] faceVertexIndices = [0, 1, 2]
        point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
        uniform token subdivisionScheme = "none"
    }
}
`;

const MESH_PLY = `ply
format ascii 1.0
element vertex 3
property float x
property float y
property float z
element face 1
property list uchar int vertex_indices
end_header
0 0 0
1 0 0
0 1 0
3 0 1 2
`;

describe('AssetManager model routing', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
		AssetManager.resetInstance();
	});

	it('routes an FBX URL through loadFBX', async () => {
		const manager = AssetManager.getInstance();
		const loadFBX = vi.spyOn(manager, 'loadFBX').mockResolvedValue({
			object: new Group(),
			animations: [],
		});

		await manager.loadModel('hero.fbx?cache=1', { clone: true });

		expect(loadFBX).toHaveBeenCalledWith('hero.fbx?cache=1', { clone: true });
	});

	it('rejects Alembic instead of parsing it', async () => {
		await expect(AssetManager.getInstance().loadModel('shot.abc')).rejects.toThrow(ALEMBIC_UNSUPPORTED_MESSAGE);
	});

	it('keeps a forced mesh PLY and a sniffed splat PLY in different cache entries', async () => {
		const manager = AssetManager.getInstance();
		vi.stubGlobal('fetch', async () => new Response(MESH_PLY));

		const mesh = await manager.loadModel('/scan.ply', { fileType: 'mesh' });
		const again = await manager.loadModel('/scan.ply', { fileType: 'mesh' });
		expect(mesh.object).toBeInstanceOf(Mesh);
		expect(again.object).toBe(mesh.object);

		await expect(manager.loadModel('/scan.ply', { fileType: 'splat' })).rejects.toThrow(/Gaussian|PLY|splat/i);
		expect((await manager.loadModel('/scan.ply', { fileType: 'mesh' })).object).toBe(mesh.object);
		expect(manager.isCached('/scan.ply')).toBe(true);
	});

	it('loads USDA and USDZ through USDLoader without the deprecated USDZ class', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const zipped = zipSync({
			'triangle.usda': new TextEncoder().encode(TRIANGLE_USDA),
		});
		vi.stubGlobal('fetch', async (url: string) => {
			const body = String(url).endsWith('.usdz') ? zipped : TRIANGLE_USDA;
			return new Response(body);
		});

		const manager = AssetManager.getInstance();
		const usda = await manager.loadModel('/triangle.usda');
		const usdz = await manager.loadModel('/triangle.usdz');

		expect(usda.object).toBeInstanceOf(Group);
		expect(usdz.object).toBeInstanceOf(Group);
		expect(usda.object.children.length + usdz.object.children.length).toBeGreaterThan(0);
		expect(warn.mock.calls.some((args) => String(args[0]).includes('USDZLoader'))).toBe(false);
	});
});
