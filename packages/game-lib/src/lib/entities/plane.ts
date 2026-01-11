import { ColliderDesc } from '@dimforge/rapier3d-compat';
import { Color, PlaneGeometry, Vector2, Vector3 } from 'three';
import { TexturePath } from '../graphics/material';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { EntityBuilder } from './builder';
import { EntityCollisionBuilder } from './builder';
import { EntityMeshBuilder } from './builder';
import { XZPlaneGeometry } from '../graphics/geometries/XZPlaneGeometry';
import { createEntity } from './create';

type ZylemPlaneOptions = GameEntityOptions & {
	tile?: Vector2;
	repeat?: Vector2;
	texture?: TexturePath;
	subdivisions?: number;
	randomizeHeight?: boolean;
	heightMap?: number[];
	heightScale?: number;
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
		color: new Color('#ffffff'),
		shader: 'standard'
	},
	subdivisions: DEFAULT_SUBDIVISIONS,
	randomizeHeight: false,
	heightScale: 1,
};

export class PlaneCollisionBuilder extends EntityCollisionBuilder {
	collider(options: ZylemPlaneOptions): ColliderDesc {
		const tile = options.tile ?? new Vector2(1, 1);
		const subdivisions = options.subdivisions ?? DEFAULT_SUBDIVISIONS;
		const size = new Vector3(tile.x, 1, tile.y);

		const heightData = (options._builders?.meshBuilder as unknown as PlaneMeshBuilder)?.heightData;
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
	private subdivisions: number = DEFAULT_SUBDIVISIONS;

	build(options: ZylemPlaneOptions): XZPlaneGeometry {
		const tile = options.tile ?? new Vector2(1, 1);
		const subdivisions = options.subdivisions ?? DEFAULT_SUBDIVISIONS;
		this.subdivisions = subdivisions;
		const size = new Vector3(tile.x, 1, tile.y);
		const heightScale = options.heightScale ?? 1;

		const geometry = new XZPlaneGeometry(size.x, size.z, subdivisions, subdivisions);
		const vertexGeometry = new PlaneGeometry(size.x, size.z, subdivisions, subdivisions);
		const dx = size.x / subdivisions;
		const dy = size.z / subdivisions;
		const originalVertices = geometry.attributes.position.array;
		const vertices = vertexGeometry.attributes.position.array;
		const columsRows = new Map();

		// Get height data source
		const heightMapData = options.heightMap;
		const useRandomHeight = options.randomizeHeight ?? false;

		for (let i = 0; i < vertices.length; i += 3) {
			const vertexIndex = i / 3;
			let row = Math.floor(Math.abs((vertices as any)[i] + (size.x / 2)) / dx);
			let column = Math.floor(Math.abs((vertices as any)[i + 1] - (size.z / 2)) / dy);

			let height = 0;
			if (heightMapData && heightMapData.length > 0) {
				// Loop the height map data if it doesn't cover all vertices
				const heightIndex = vertexIndex % heightMapData.length;
				height = heightMapData[heightIndex] * heightScale;
			} else if (useRandomHeight) {
				height = Math.random() * 4 * heightScale;
			}

			(vertices as any)[i + 2] = height;
			originalVertices[i + 1] = height;
			if (!columsRows.get(column)) {
				columsRows.set(column, new Map());
			}
			columsRows.get(column).set(row, height);
		}
		this.columnsRows = columsRows;
		return geometry;
	}

	postBuild(): void {
		const heights = [];
		for (let i = 0; i <= this.subdivisions; ++i) {
			for (let j = 0; j <= this.subdivisions; ++j) {
				const row = this.columnsRows.get(j);
				if (!row) {
					heights.push(0);
					continue;
				}
				const data = row.get(i);
				heights.push(data ?? 0);
			}
		}
		this.heightData = new Float32Array(heights as unknown as number[]);
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
