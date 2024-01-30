import { Vector3 } from "three";
import { EntityParameters } from "../core/entity";
import { GameEntity } from "../core/game-entity";
import { GameEntityOptions } from "../interfaces/entity";
import { BoxMesh, CreateMeshParameters } from "../core/mesh";
import { BoxCollision, CreateCollisionParameters } from "../collision/collision";
import { Interactive } from "../behaviors/interactive";
import { applyComposition } from "../core/composable";

type ZylemNewBoxOptions = GameEntityOptions<GameEntity> & {
	size?: Vector3;
	static?: boolean;
}

export class ZylemNewBox extends GameEntity {
	private createMesh(params: CreateMeshParameters) { }
	private createCollision(params: CreateCollisionParameters) { }
	private updateMovement(params: EntityParameters<this>) { }

	protected type = 'NewBox';
	_static: boolean = false;

	constructor(initializer: () => ZylemNewBoxOptions) {
		const bluePrint = initializer();
		super(bluePrint);
		this._static = bluePrint.static ?? false;
	}

	public createFromBlueprint(): this {
		this.createMesh({ group: this.group });
		this.createCollision({ isDynamicBody: !this._static });
		return this;
	}

	public update(params: EntityParameters<this>): void {
		super.update(params);
		this.updateMovement(params);
		this._update(params);
	}

	public setup() {
		super.setup();
		this._setup();
	}

	public destroy(): void {
		throw new Error("Method not implemented.");
	}

}

export type NewBoxType = Omit<ZylemNewBox, '_update' | 'createFromBlueprint'>;

export function NewBox(initializer: () => ZylemNewBoxOptions): NewBoxType {
	const composition = [BoxMesh, BoxCollision, Interactive];
	const NewBoxComposition = applyComposition(composition, ZylemNewBox);

	return new NewBoxComposition(initializer) as NewBoxType;
}
