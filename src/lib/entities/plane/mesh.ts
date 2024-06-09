import { Group, Mesh, PlaneGeometry, Vector2, Vector3 } from "three";
import { BaseMesh, CreateMeshParameters } from "~/lib/core/mesh";

export class PlaneMesh extends BaseMesh {
	_tile: Vector2 = new Vector2(1, 1);
	size: Vector3 = new Vector3(1, 1, 1);
	heights: number[] = [];
	subdivisions = 20;

	createMesh({ group = new Group(), tile = new Vector2(1, 1), materials }: CreateMeshParameters) {
		const scale = 1; // TODO: pass scale as parameter
		this.subdivisions = 20;
		const subdivisions = this.subdivisions;
		this.size = new Vector3(tile.x * scale, 1, tile.y * scale);

		this._tile = tile;

		const geometry = new PlaneGeometry(this.size.x, this.size.z, subdivisions, subdivisions);
		const heights = [];

		//@ts-ignore
		const vertices = geometry.attributes.position.array;
		const dx = this.size.x / subdivisions;
		const dy = this.size.z / subdivisions;
		// store height data in map column-row map
		const columsRows = new Map();
		for (let i = 0; i < vertices.length; i += 3) {
			// translate into colum / row indices
			let row = Math.floor(Math.abs((vertices as any)[i] + (this.size.x / 2)) / dx);
			let column = Math.floor(Math.abs((vertices as any)[i + 1] - (this.size.z / 2)) / dy);
			// generate height for this column & row
			// const randomHeight = 0.1;
			const randomHeight = Math.random() * 0.4;
			(vertices as any)[i + 2] = randomHeight;
			// store height
			if (!columsRows.get(column)) {
				columsRows.set(column, new Map());
			}
			columsRows.get(column).set(row, randomHeight);
		}
		this.mesh = new Mesh(geometry, materials.at(-1));
		this.mesh.position.set(0, 0, 0);
		this.mesh.rotateX(-Math.PI / 2);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;
		this.mesh.geometry.computeVertexNormals();

		// store height data into column-major-order matrix array
		for (let i = 0; i <= subdivisions; ++i) {
			for (let j = 0; j <= subdivisions; ++j) {
				const row = columsRows.get(j);
				if (!row) {
					continue;
				}
				const data = row.get(i);
				heights.push(data);
			}
		}
		this.heights = heights;
		group.add(this.mesh);
	}
}