// Sphere is a combination of a 3D mesh and a physics body
import { Color } from 'three';
import { Mixin } from 'ts-mixer';

import { EntityParameters, StageEntity } from '../../core';
import { TexturePath, ZylemMaterial } from '../../core/material';
import { StageEntityOptions } from '../../interfaces/entity';
import { ZylemBlueColor } from '../../interfaces/utility';
import { SphereMesh, SphereCollision } from './index';
import { Moveable } from '../../behaviors/moveable';

type ZylemSphereOptions = {
	radius?: number;
	static?: boolean;
	texture?: TexturePath;
	color?: Color;
}

type SphereOptions = StageEntityOptions<ZylemSphereOptions, ZylemSphere>;

const sphereDefaults: SphereOptions = {
	radius: 1,
	static: false,
	texture: null,
	color: ZylemBlueColor,
	shader: 'standard',
};

export class ZylemSphere extends Mixin(StageEntity, ZylemMaterial, SphereMesh, SphereCollision, Moveable) {

	public type = 'Sphere';

	constructor(options: SphereOptions) {
		super(options as StageEntityOptions<{}, unknown>);
		this._static = options.static ?? false;
		this._texture = options.texture ?? null;
		this._shader = options.shader ?? 'standard';
		this._radius = options.radius ?? 1;
		this._collisionRadius = this._radius;
		this._color = options.color ?? ZylemBlueColor;
	}

	async create(): Promise<this> {
		await this.createMaterials({
			texture: this._texture,
			color: this._color,
			repeat: this._repeat,
			shader: this._shader
		});
		this.createMesh({ group: this.group, radius: this._radius, materials: this.materials });
		this.createCollision({ isDynamicBody: !this._static });
		return Promise.resolve(this);
	}

	public setup(params: EntityParameters<ZylemSphere>): void {
		super.setup(params);
		this._setup({ ...params, entity: this });
	}

	public update(params: EntityParameters<ZylemSphere>): void {
		super.update(params);
		for (const material of this.materials) {
			if (material.isShaderMaterial && material.uniforms) {
				material.uniforms.iTime.value += params.delta;
			}
		}
		this._update({ ...params, entity: this });
	}

	public destroy(params: EntityParameters<ZylemSphere>): void {
		super.destroy(params);
		this._destroy({ ...params, entity: this });
	}
}

export function sphere(options: SphereOptions = sphereDefaults): ZylemSphere {
	return new ZylemSphere(options) as ZylemSphere;
}