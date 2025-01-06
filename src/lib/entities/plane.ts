import { ActiveCollisionTypes, ColliderDesc } from '@dimforge/rapier3d-compat';
import { Group, Mesh, PlaneGeometry, Vector2, Vector3, Color } from 'three';
import { BaseMesh, CreateMeshParameters } from '~/lib/graphics/mesh';
import { Mixin } from 'ts-mixer';

import { StageEntity } from '../core';
import { TexturePath, ZylemMaterial } from '../graphics/material';
import { StageEntityOptions } from '../interfaces/entity';
import { ZylemBlueColor } from '../core/utility';

export class PlaneCollision { //extends BaseCollision {
	createCollider(isSensor: boolean = false) {
		//@ts-ignore
		let colliderDesc = ColliderDesc.heightfield(
			//@ts-ignore
			this.subdivisions, this.subdivisions, new Float32Array(this.heights), this.size
		);
		colliderDesc.setSensor(isSensor);
		colliderDesc.activeCollisionTypes = (isSensor) ? ActiveCollisionTypes.KINEMATIC_FIXED : ActiveCollisionTypes.DEFAULT;
		return colliderDesc;
	}
}

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

type ZylemPlaneOptions = {
	tile?: Vector2;
	repeat?: Vector2;
	static?: boolean;
	texture?: TexturePath;
	color?: Color;
}

type PlaneOptions = StageEntityOptions<ZylemPlaneOptions, ZylemPlane>;

export class ZylemPlane extends Mixin(StageEntity, ZylemMaterial, PlaneMesh, PlaneCollision) {

	public type = 'Plane';

	constructor(options: PlaneOptions) {
		super(options as StageEntityOptions<{}, unknown>);
		this._static = options.static ?? true;
		this._texture = options.texture ?? null;
		this._tile = options.tile ?? new Vector2(1, 1);
		this._repeat = options.repeat ?? new Vector2(1, 1);
		this._color = options.color ?? ZylemBlueColor;
		this._shader = options.shader ?? 'standard';
	}

	async create(): Promise<this> {
		await this.createMaterials({
			texture: this._texture,
			color: this._color,
			repeat: this._repeat,
			shader: this._shader
		});
		this.createMesh({ group: this.group, tile: this._tile!, materials: this.materials });
		this.createCollision({ isDynamicBody: !this._static });
		return Promise.resolve(this);
	}

	public setup(params: EntityParameters<ZylemPlane>): void {
		super.setup(params);
		this._setup({ ...params, entity: this });
	}

	public update(params: EntityParameters<ZylemPlane>): void {
		super.update(params);
		for (const material of this.materials) {
			if (material.isShaderMaterial && material.uniforms) {
				material.uniforms.iTime.value += params.delta;
			}
		}
		this._update({ ...params, entity: this });
	}

	public destroy(params: EntityParameters<ZylemPlane>): void {
		super.destroy(params);
		this._destroy({ ...params, entity: this });
	}
}

export function plane(options: PlaneOptions): ZylemPlane {
	return new ZylemPlane(options) as ZylemPlane;
}