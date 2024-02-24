// Sphere is a combination of a 3D mesh and a physics body
import { Color, Vector2 } from 'three';
import { TexturePath, ZylemMaterial } from '../core/material';
import { GameEntity } from '../core/game-entity';
import { GameEntityOptions } from '../interfaces/entity';
import { ZylemBlueColor } from '../interfaces/utility';
import { LifecycleParameters, UpdateParameters } from '../core/entity';
import { SphereMesh } from '../core/mesh';
import { SphereCollision } from '../collision/collision';
import { Moveable } from '../behaviors/moveable';
import { applyMixins } from '../core/composable';

type ZylemSphereOptions = GameEntityOptions<ZylemSphere> & {
	radius?: number;
	static?: boolean;
	texture?: TexturePath;
	color?: Color;
}

export class ZylemSphere extends GameEntity<ZylemSphere> {
	protected type = 'Sphere';
	_static: boolean = false;
	_texture: TexturePath = null;
	_radius: number = 1;
	_color: Color = ZylemBlueColor;
	_repeat: Vector2 = new Vector2(1, 1);

	constructor(options: ZylemSphereOptions) {
		const bluePrint = options;
		super(bluePrint);
		this._static = bluePrint.static ?? false;
		this._texture = bluePrint.texture ?? null;
		this._radius = bluePrint.radius ?? 1;
		this._color = bluePrint.color ?? ZylemBlueColor;
	}

	async createFromBlueprint(): Promise<this> {
		this.createMaterials({ texture: this._texture, color: this._color, repeat: this._repeat });
		this.createMesh({ group: this.group, radius: this._radius, materials: this.materials });
		this.createCollision({ isDynamicBody: !this._static });
		return Promise.resolve(this);
	}

	public setup(params: LifecycleParameters<ZylemSphere>) {
		super.setup({ ...params, entity: this });
		this._setup({ ...params, entity: this });
	}

	public update(params: UpdateParameters<ZylemSphere>): void {
		super.update({ ...params, entity: this });
		this._update({ ...params, entity: this });
	}

	public destroy(params: LifecycleParameters<ZylemSphere>): void {
		super.destroy({ ...params, entity: this });
		this._destroy({ ...params, entity: this });
	}
}

class _Sphere { };

export interface ZylemSphere extends ZylemMaterial, SphereMesh, SphereCollision, Moveable, _Sphere { };

export function Sphere(options: ZylemSphereOptions): ZylemSphere {
	applyMixins(ZylemSphere, [ZylemMaterial, SphereMesh, SphereCollision, Moveable, _Sphere]);

	return new ZylemSphere(options) as ZylemSphere;
}