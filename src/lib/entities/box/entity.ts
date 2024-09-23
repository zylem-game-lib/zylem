import { Vector3, Color } from "three";

import { Entity, EntityOptions, StageEntity } from "../../core";
import { StageEntityOptions } from "../../interfaces/entity";
import { TexturePath, ZylemMaterial } from '../../core/material';
import { SizeVector, ZylemBlueColor } from "../../interfaces/utility";
import { BoxMesh, BoxCollision } from "./index";
import { Behavior } from "~/lib/behaviors/behavior";
import { Lifecycle } from "~/lib/core/entity-life-cycle";
import { applyMixins } from "~/lib/core/composable";
import { position, rotation, scale } from "~/lib/behaviors/transform";

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

type BoxOptions = StageEntityOptions<ZylemBoxOptions, ZylemBox> & Partial<EntityOptions<ZylemBox>>;

class ZylemBox {
	public type = 'Box';
	options: BoxOptions = boxDefaults;

	constructor(options: BoxOptions) {
		if (!options) {
			return;
		}
		this.options = options;
	}

	async create(): Promise<this> {
		await this.createMaterials({
			texture: this._texture,
			color: this._color,
			repeat: this._repeat,
			shader: this._shader
		});
		this.createMesh({
			group: this.group,
			size: this._size,
			materials: this.materials
		});
		this.createCollision({ isDynamicBody: !this._static });
		return Promise.resolve(this);
	}
}

interface ZylemBox extends Entity<ZylemBox>, StageEntity, Lifecycle<ZylemBox>, BoxCollision, ZylemMaterial, BoxMesh  {}
applyMixins(ZylemBox, [Entity, StageEntity, Lifecycle, BoxCollision, ZylemMaterial, BoxMesh]);

export function box(options: BoxOptions = boxDefaults, ...behaviors: Behavior[]): ZylemBox {
	const zylemBox = new ZylemBox(options) as ZylemBox;
	zylemBox.entityDefaults(options);
	zylemBox.lifecycleDefaults(options);
	zylemBox.stageEntityDefaults();
	zylemBox._static = options.static ?? boxDefaults.static!;
	zylemBox._texture = options.texture ?? boxDefaults.texture!;
	zylemBox._size = options.size ?? boxDefaults.size!;
	zylemBox.collisionSize = options.size ?? boxDefaults.size!;
	zylemBox._color = options.color ?? boxDefaults.color!;
	zylemBox._shader = options.shader ?? boxDefaults.shader!;
	zylemBox._behaviors = [
		{ component: position, values: { x: 0, y: 0, z: 0 } },
		{ component: scale , values: { x: 0, y: 0, z: 0 } },
		{ component: rotation , values: { x: 0, y: 0, z: 0, w: 0 } },
		...behaviors
	];
	return zylemBox;
}
