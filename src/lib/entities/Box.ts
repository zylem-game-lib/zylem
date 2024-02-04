import { Vector3 } from "three";
import { LifecycleParameters, UpdateParameters } from "../core/entity";
import { GameEntity } from "../core/game-entity";
import { GameEntityOptions } from "../interfaces/entity";
import { BoxMesh, CreateMeshParameters } from "../core/mesh";
import { BoxCollision, CreateCollisionParameters } from "../collision/collision";
import { Interactive } from "../behaviors/interactive";
import { applyComposition } from "../core/composable";

type ZylemBoxOptions = GameEntityOptions<GameEntity> & {
	size?: Vector3;
	static?: boolean;
}

export class ZylemBox extends GameEntity {
	private createMesh(params: CreateMeshParameters) { }
	private createCollision(params: CreateCollisionParameters) { }

	protected type = 'Box';
	_static: boolean = false;

	constructor(initializer: () => ZylemBoxOptions) {
		const bluePrint = initializer();
		super(bluePrint);
		this._static = bluePrint.static ?? false;
	}

	public createFromBlueprint(): this {
		this.createMesh({ group: this.group });
		this.createCollision({ isDynamicBody: !this._static });
		return this;
	}

	public setup(params: LifecycleParameters<this>) {
		super.setup(params);
		this._setup(params);
	}

	public update(params: UpdateParameters<this>): void {
		super.update(params);
		this._update(params);
	}

	public destroy(params: LifecycleParameters<this>): void {
		super.destroy(params);
		this._destroy(params);
	}
}

export type BoxType = Omit<ZylemBox, '_update' | 'createFromBlueprint'>;

export function Box(initializer: () => ZylemBoxOptions): BoxType {
	const composition = [BoxMesh, BoxCollision, Interactive];
	const BoxComposition = applyComposition(composition, ZylemBox);

	return new BoxComposition(initializer) as BoxType;
}
