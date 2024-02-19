import { Vector3, Color, Vector2 } from "three";
import { LifecycleParameters, UpdateParameters } from "../core/entity";
import { GameEntity } from "../core/game-entity";
import { GameEntityOptions } from "../interfaces/entity";
import { PlaneMesh } from "../core/mesh";
import { PlaneCollision } from "../collision/collision";
import { applyMixins } from "../core/composable";
import { TexturePath, ZylemMaterial } from '../core/material';
import { Moveable } from "../behaviors/moveable";
import { ZylemBlueColor } from "../interfaces/utility";

type ZylemPlaneOptions = GameEntityOptions<ZylemPlane> & {
	tile?: Vector2;
	repeat?: Vector2;
	static?: boolean;
	texture?: TexturePath;
	color?: Color;
}

export class ZylemPlane extends GameEntity<ZylemPlane> {
	protected type = 'Plane';
	_static: boolean = true;
	_texture: TexturePath = null;
	_tile: Vector2 | null = null;
	_color: Color = ZylemBlueColor;
	_repeat: Vector2 = new Vector2(1, 1);

	constructor(options: ZylemPlaneOptions) {
		const bluePrint = options;
		super(bluePrint);
		this._static = bluePrint.static ?? true;
		this._texture = bluePrint.texture ?? null;
		this._tile = bluePrint.tile ?? new Vector2(1, 1);
		this._repeat = bluePrint.repeat ?? new Vector2(1, 1);
		this._color = bluePrint.color ?? ZylemBlueColor;
	}

	public createFromBlueprint(): this {
		this.createMaterials({ texture: this._texture, color: this._color, repeat: this._repeat });
		this.createMesh({ group: this.group, tile: this._tile!, materials: this.materials });
		this.createCollision({ isDynamicBody: !this._static });
		return this;
	}

	public setup(params: LifecycleParameters<ZylemPlane>) {
		super.setup({ ...params, entity: this });
		this._setup({ ...params, entity: this });
	}

	public update(params: UpdateParameters<ZylemPlane>): void {
		super.update({ ...params, entity: this });
		this._update({ ...params, entity: this });
	}

	public destroy(params: LifecycleParameters<ZylemPlane>): void {
		super.destroy({ ...params, entity: this });
		this._destroy({ ...params, entity: this });
	}
}

class _Plane { };

export interface ZylemPlane extends ZylemMaterial, PlaneMesh, PlaneCollision, Moveable, _Plane { };

export function Plane(options: ZylemPlaneOptions): ZylemPlane {
	applyMixins(ZylemPlane, [ZylemMaterial, PlaneMesh, PlaneCollision, Moveable, _Plane]);

	return new ZylemPlane(options) as ZylemPlane;
}