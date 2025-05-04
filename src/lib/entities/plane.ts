import { ColliderDesc } from '@dimforge/rapier3d-compat';
import { Mesh, PlaneGeometry, Vector2, Vector3 } from 'three';
import { TexturePath } from '../graphics/material';
import { ZylemBlueColor } from '../core/utility';
import { BaseNode } from '../core/base-node';
import { EntityBuilder, EntityCollisionBuilder, EntityMeshBuilder, EntityOptions, GameEntity } from './entity';
import { XZPlaneGeometry } from '../graphics/geometries/XZPlaneGeometry';
import { createEntity } from './create';

type ZylemPlaneOptions = EntityOptions & {
	tile?: Vector2;
	repeat?: Vector2;
	texture?: TexturePath;
	subdivisions?: number;
};

const DEFAULT_SUBDIVISIONS = 4;

const planeDefaults: ZylemPlaneOptions = {
	tile: new Vector2(10, 10),
	repeat: new Vector2(1, 1),
	position: new Vector3(0, 0, 0),
	collision: {
		static: true,
	},
	material: {
		color: ZylemBlueColor,
		shader: 'standard'
	},
	subdivisions: DEFAULT_SUBDIVISIONS
};

export class PlaneCollisionBuilder extends EntityCollisionBuilder {
	private subdivisions: number = DEFAULT_SUBDIVISIONS;
	private size: Vector3 = new Vector3(1, 1, 1);

	collider(options: ZylemPlaneOptions): ColliderDesc {
		const tile = options.tile ?? new Vector2(1, 1);
		const subdivisions = options.subdivisions ?? DEFAULT_SUBDIVISIONS;
		const size = new Vector3(tile.x, 1, tile.y);

		const heightData = (options._builders?.meshBuilder as PlaneMeshBuilder)?.heightData;
		const scale = new Vector3(size.x, 1, size.z);
		let colliderDesc = ColliderDesc.heightfield(
			subdivisions,
			subdivisions,
			heightData,
			scale
		);

		return colliderDesc;
	}
}

export class PlaneMeshBuilder extends EntityMeshBuilder {
	heightData: Float32Array = new Float32Array();
	columnsRows = new Map();

	buildGeometry(options: ZylemPlaneOptions): XZPlaneGeometry {
		const tile = options.tile ?? new Vector2(1, 1);
		const subdivisions = options.subdivisions ?? DEFAULT_SUBDIVISIONS;
		const size = new Vector3(tile.x, 1, tile.y);

		const geometry = new XZPlaneGeometry(size.x, size.z, subdivisions, subdivisions);
		const vertexGeometry = new PlaneGeometry(size.x, size.z, subdivisions, subdivisions);
		const dx = size.x / subdivisions;
		const dy = size.z / subdivisions;
		const originalVertices = geometry.attributes.position.array;
		const vertices = vertexGeometry.attributes.position.array;
		const columsRows = new Map();
		for (let i = 0; i < vertices.length; i += 3) {
			let row = Math.floor(Math.abs((vertices as any)[i] + (size.x / 2)) / dx);
			let column = Math.floor(Math.abs((vertices as any)[i + 1] - (size.z / 2)) / dy);
			const randomHeight = Math.random() * 4;
			(vertices as any)[i + 2] = randomHeight;
			originalVertices[i + 1] = randomHeight;
			if (!columsRows.get(column)) {
				columsRows.set(column, new Map());
			}
			columsRows.get(column).set(row, randomHeight);
		}
		this.columnsRows = columsRows;
		return geometry;
	}

	postBuild(mesh: Mesh): Mesh {
		const heights = [];
		for (let i = 0; i <= DEFAULT_SUBDIVISIONS; ++i) {
			for (let j = 0; j <= DEFAULT_SUBDIVISIONS; ++j) {
				const row = this.columnsRows.get(j);
				if (!row) {
					continue;
				}
				const data = row.get(i);
				heights.push(data);
			}
		}
		this.heightData = new Float32Array(heights as unknown as number[]);
		return mesh;
	}
}

export class PlaneBuilder extends EntityBuilder<ZylemPlane, ZylemPlaneOptions> {
	protected createEntity(options: Partial<ZylemPlaneOptions>): ZylemPlane {
		return new ZylemPlane(options);
	}
}

export const PLANE_TYPE = Symbol('Plane');

export class ZylemPlane extends GameEntity<ZylemPlaneOptions> {
	static type = PLANE_TYPE;

	constructor(options?: ZylemPlaneOptions) {
		super();
		this.options = { ...planeDefaults, ...options };
	}
}

type PlaneOptions = BaseNode | Partial<ZylemPlaneOptions>;

export async function plane(...args: Array<PlaneOptions>): Promise<ZylemPlane> {
	return createEntity<ZylemPlane, ZylemPlaneOptions>({
		args,
		defaultConfig: planeDefaults,
		EntityClass: ZylemPlane,
		BuilderClass: PlaneBuilder,
		MeshBuilderClass: PlaneMeshBuilder,
		CollisionBuilderClass: PlaneCollisionBuilder,
		entityType: ZylemPlane.type
	});
}
