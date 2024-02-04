import { Vector3, Color } from "three";
import { LifecycleParameters, UpdateParameters } from "../core/entity";
import { GameEntity } from "../core/game-entity";
import { GameEntityOptions } from "../interfaces/entity";
import { BoxMesh } from "../core/mesh";
import { BoxCollision } from "../collision/collision";
import { applyMixins } from "../core/composable";
import { ZylemMaterial } from '../core/material';
import { Moveable } from "../behaviors/n-moveable";

type TexturePath = string | null;
type SizeVector = Vector3 | null;

type ZylemBoxOptions = GameEntityOptions<ZylemBox> & {
	size?: SizeVector;
	static?: boolean;
	texture?: TexturePath;
}

export class ZylemBox extends GameEntity<ZylemBox> {
	protected type = 'Box';
	_static: boolean = false;
	_texture: TexturePath = null;
	_size: SizeVector = null;

	constructor(initializer: () => ZylemBoxOptions) {
		const bluePrint = initializer();
		super(bluePrint);
		this._static = bluePrint.static ?? false;
		this._texture = bluePrint.texture ?? null;
		this._size = bluePrint.size ?? new Vector3(1, 1, 1);
	}

	public createFromBlueprint(): this {
		this.applyMaterial(new Color('blue'));
		if (this._texture) {
			this.applyTexture(this._texture);
		}
		this.createMesh({ group: this.group, materials: this.materials });
		this.createCollision({ isDynamicBody: !this._static });
		return this;
	}

	public setup(params: LifecycleParameters<ZylemBox>) {
		super.setup({ ...params, entity: this });
		this._setup({ ...params, entity: this });
	}

	public update(params: UpdateParameters<ZylemBox>): void {
		super.update({ ...params, entity: this });
		this._update({ ...params, entity: this });
	}

	public destroy(params: LifecycleParameters<ZylemBox>): void {
		super.destroy({ ...params, entity: this });
		this._destroy({ ...params, entity: this });
	}
}

class _Box { };

export interface ZylemBox extends ZylemMaterial, BoxMesh, BoxCollision, Moveable, _Box { };

export function Box(initializer: () => ZylemBoxOptions): ZylemBox {
	applyMixins(ZylemBox, [ZylemMaterial, BoxMesh, BoxCollision, Moveable, _Box]);

	return new ZylemBox(initializer) as ZylemBox;
}