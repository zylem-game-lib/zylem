// Sphere is a combination of a 3D mesh and a physics body
import { Color } from 'three';
import { Mixin, settings } from 'ts-mixer';

import { EntityParameters, GameEntity } from '../../core';
import { TexturePath, ZylemMaterial } from '../../core/material';
import { GameEntityOptions } from '../../interfaces/entity';
import { ZylemBlueColor } from '../../interfaces/utility';
import { SphereMesh, SphereCollision } from './index';
import { Moveable } from '../../behaviors/moveable';

type ZylemSphereOptions = {
	radius?: number;
	static?: boolean;
	texture?: TexturePath;
	color?: Color;
}

type SphereOptions = GameEntityOptions<ZylemSphereOptions, ZylemSphere>;

settings.initFunction = 'init';

export class ZylemSphere extends Mixin(GameEntity, ZylemMaterial, SphereMesh, SphereCollision, Moveable) {
	protected type = 'Sphere';

	constructor(options: SphereOptions) {
		super(options as GameEntityOptions<{}, unknown>);
		this._static = options.static ?? false;
		this._texture = options.texture ?? null;
		this._radius = options.radius ?? 1;
		this._collisionRadius = this._radius;
		this._color = options.color ?? ZylemBlueColor;
	}

	async createFromBlueprint(): Promise<this> {
		this.createMaterials({ texture: this._texture, color: this._color, repeat: this._repeat });
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
		this._update({ ...params, entity: this });
	}

	public destroy(params: EntityParameters<ZylemSphere>): void {
		super.destroy(params);
		this._destroy({ ...params, entity: this });
	}
}

export function sphere(options: SphereOptions): ZylemSphere {
	return new ZylemSphere(options) as ZylemSphere;
}