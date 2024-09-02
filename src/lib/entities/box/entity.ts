import { Vector3, Color } from "three";
import { Mixin } from 'ts-mixer';

import { EntityParameters, GameEntity } from "../../core";
import { GameEntityOptions } from "../../interfaces/entity";
import { TexturePath, ZylemMaterial } from '../../core/material';
import { Moveable } from "../../behaviors/moveable";
import { SizeVector, ZylemBlueColor } from "../../interfaces/utility";
import { BoxMesh, BoxCollision } from "./index";

type ZylemBoxOptions = {
	size?: SizeVector;
	static?: boolean;
	texture?: TexturePath;
	color?: Color;
}

const boxDefaults: BoxOptions = {
	size: new Vector3(1, 1, 1),
	static: false,
	texture: null,
	color: ZylemBlueColor,
	shader: 'standard',
};

type BoxOptions = GameEntityOptions<ZylemBoxOptions, ZylemBox>;

class ZylemBox extends Mixin(GameEntity, ZylemMaterial, BoxMesh, BoxCollision, Moveable) {

	public type = 'Box';

	constructor(options: BoxOptions) {
		if (!options) {
			return;
		}
		super(options as GameEntityOptions<{}, unknown>);
		this._static = options.static ?? false;
		this._texture = options.texture ?? null;
		this._size = options.size ?? new Vector3(1, 1, 1);
		this._color = options.color ?? ZylemBlueColor;
		this._shader = options.shader ?? 'standard';
	}

	async create(): Promise<this> {
		await this.createMaterials({ texture: this._texture, color: this._color, repeat: this._repeat, shader: this._shader });
		this.createMesh({ group: this.group, size: this._size, materials: this.materials });
		this.createCollision({ isDynamicBody: !this._static });
		return Promise.resolve(this);
	}

	public setup(params: EntityParameters<this>): void {
		super.setup(params);
		this._setup({ ...params, entity: this });
	}

	public update(params: EntityParameters<this>): void {
		super.update(params);
		this._update({ ...params, entity: this });
	}

	public destroy(params: EntityParameters<this>): void {
		super.destroy(params);
		this._destroy({ ...params, entity: this });
	}
}

export function box(options: BoxOptions = boxDefaults): ZylemBox {
	return new ZylemBox(options) as ZylemBox;
}
