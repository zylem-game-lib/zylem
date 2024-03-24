import { Vector3, Color } from "three";
import { Mixin, settings } from 'ts-mixer';

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

type BoxOptions = GameEntityOptions<ZylemBoxOptions, ZylemBox>;

settings.initFunction = 'init';

class ZylemBox extends Mixin(GameEntity, ZylemMaterial, BoxMesh, BoxCollision, Moveable) {

	protected type = 'Box';

	constructor(options: BoxOptions) {
		super(options as GameEntityOptions<{}, unknown>);
		this._static = options.static ?? false;
		this._texture = options.texture ?? null;
		this._size = options.size ?? new Vector3(1, 1, 1);
		this._color = options.color ?? ZylemBlueColor;
	}

	init() {
		this.createFromBlueprint();
	}

	async createFromBlueprint(): Promise<ZylemBox> {
		this.createMaterials({ texture: this._texture, color: this._color, repeat: this._repeat });
		this.createMesh({ group: this.group, materials: this.materials });
		this.createCollision({ isDynamicBody: !this._static });
		return Promise.resolve(this);
	}

	public setup(params: EntityParameters<ZylemBox>): void {
		super.setup(params);
		this._setup({ ...params, entity: this });
	}

	public update(params: EntityParameters<ZylemBox>): void {
		super.update(params);
		this._update({ ...params, entity: this });
	}

	public destroy(params: EntityParameters<ZylemBox>): void {
		super.destroy(params);
		this._destroy({ ...params, entity: this });
	}
}

export function Box(options: BoxOptions): ZylemBox {
	return new ZylemBox(options) as ZylemBox;
}
