import { BoxGeometry, Group, Material, Mesh, Object3D, PlaneGeometry, SphereGeometry, Vector2, Vector3 } from "three";

export interface BoxMeshInterface {
	createMesh: (params: CreateMeshParameters) => void;
}

export type CreateMeshParameters = {
	group: Group;
	tile?: Vector2;
	vector3?: Vector3 | undefined;
	radius?: number;
	object?: Object3D | null;
	materials: Material[];
}

// TODO: allow for multiple materials requires geometry groups
// may not need geometry groups for shaders though

export class BaseMesh {
	mesh: Mesh | null = null;
}

export class BoxMesh extends BaseMesh {
	size: Vector3 = new Vector3(1, 1, 1);

	createMesh({ group = new Group(), vector3 = new Vector3(1, 1, 1), materials }: CreateMeshParameters) {
		this.size = vector3;
		const geometry = new BoxGeometry(vector3.x, vector3.y, vector3.z);
		this.mesh = new Mesh(geometry, materials.at(-1));
		this.mesh.position.set(0, 0, 0);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;
		group.add(this.mesh);
	}
}

export class SphereMesh extends BaseMesh {
	radius: number = 1;

	createMesh({ group = new Group(), radius = 1, materials }: CreateMeshParameters) {
		this.radius = radius;
		const geometry = new SphereGeometry(radius);
		this.mesh = new Mesh(geometry, materials.at(-1));
		this.mesh.position.set(0, 0, 0);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;
		group.add(this.mesh);
	}
}

export class PlaneMesh extends BaseMesh {
	tile: Vector2 = new Vector2(20, 20);
	size: Vector3 = new Vector3(1, 1, 1);
	heights: number[] = [];
	subdivisions = 20;

	createMesh({ group = new Group(), tile = new Vector2(1, 1), materials }: CreateMeshParameters) {
		const scale = 1; // TODO: pass scale as parameter
		this.subdivisions = 20;
		const subdivisions = this.subdivisions;
		this.size = new Vector3(tile.x * scale, 1, tile.y * scale);

		this.tile = tile;

		const geometry = new PlaneGeometry(this.size.x, this.size.z, subdivisions, subdivisions);
		const heights = [];

		//@ts-ignore
		const vertices = geometry.attributes.position.array;
		const dx = this.size.x / subdivisions;
		const dy = this.size.z / subdivisions;
		// store height data in map column-row map
		const columsRows = new Map();
		// debugger;
		for (let i = 0; i < vertices.length; i += 3) {
			// translate into colum / row indices
			let row = Math.floor(Math.abs((vertices as any)[i] + (this.size.x / 2)) / dx);
			let column = Math.floor(Math.abs((vertices as any)[i + 1] - (this.size.z / 2)) / dy);
			// generate height for this column & row
			const randomHeight = Math.random() * 2;
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
				heights.push(columsRows.get(j).get(i));
			}
		}
		this.heights = heights;
		group.add(this.mesh);
	}
}

export class ActorMesh extends BaseMesh {

	createMesh({ group = new Group(), object }: CreateMeshParameters) {
		if (!object) {
			console.log('actor is missing object');
			return;
		}
		object.position.set(0, -1.2, 0);
		group.add(object);
	}
}