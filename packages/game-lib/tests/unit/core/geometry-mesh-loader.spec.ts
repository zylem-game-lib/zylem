import { Mesh, Points } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GeometryMeshAdapter } from '../../../src/lib/core/loaders/geometry-mesh-loader';

const ASCII_STL = `solid a
facet normal 0 0 1
  outer loop
    vertex 0 0 0
    vertex 1 0 0
    vertex 0 1 0
  endloop
endfacet
endsolid a
solid b
facet normal 0 0 1
  outer loop
    vertex 0 0 0
    vertex 0 1 0
    vertex 0 0 1
  endloop
endfacet
endsolid b
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

const POINT_PLY = `ply
format ascii 1.0
element vertex 1
property float x
property float y
property float z
end_header
1 2 3
`;

describe('GeometryMeshAdapter', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('wraps STL in a mesh and rotates Z-up files', async () => {
		vi.stubGlobal('fetch', async () => new Response(ASCII_STL));
		const loader = new GeometryMeshAdapter();

		const trusted = await loader.load('/part.stl');
		const zUp = await loader.load('/part.stl', { upAxis: 'z' });

		expect(trusted.object).toBeInstanceOf(Mesh);
		expect(trusted.object.rotation.x).toBe(0);
		expect(zUp.object.rotation.x).toBeCloseTo(-Math.PI / 2, 5);
		expect((trusted.object as Mesh).geometry.groups.length).toBeGreaterThan(1);
		expect(Array.isArray((trusted.object as Mesh).material)).toBe(true);
	});

	it('wraps a faced PLY in a mesh and a point PLY in points', async () => {
		const loader = new GeometryMeshAdapter();
		vi.stubGlobal('fetch', async () => new Response(MESH_PLY));
		const mesh = await loader.load('/scan.ply');
		vi.stubGlobal('fetch', async () => new Response(POINT_PLY));
		const points = await loader.load('/cloud.ply');

		expect(mesh.object).toBeInstanceOf(Mesh);
		expect((mesh.object as Mesh).geometry.getAttribute('normal')).toBeTruthy();
		expect(points.object).toBeInstanceOf(Points);
	});
});
