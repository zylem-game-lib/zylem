import { Color, Vector2 } from "three";
import { Mixin } from "ts-mixer";

import { EntityParameters, StageEntity } from "../../core";
import { TexturePath, ZylemMaterial } from '../../core/material';
import { StageEntityOptions } from "../../interfaces/entity";
import { ZylemBlueColor } from "../../interfaces/utility";
import { PlaneMesh, PlaneCollision } from "./index";

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