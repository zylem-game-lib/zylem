import { Vector3 } from "three";
import { EntityParameters } from "../core/entity";
import { GameEntity } from "../core/game-entity";
import { GameEntityOptions } from "../interfaces/entity";
import { BoxMesh, BoxMeshInterface } from "../core/mesh";

type ZylemNewBoxOptions = GameEntityOptions<GameEntity> & {
	size: Vector3;
}

// group: Group;
// body?: RigidBody;
// bodyDescription: RigidBodyDesc;
export class ZylemNewBox extends GameEntity implements BoxMeshInterface {
	protected type = 'NewBox';
	static: boolean = false;

	constructor(initializer: () => ZylemNewBoxOptions) {
		const bluePrint = initializer();
		super(bluePrint);
	}

	public createMesh() { }

	public createFromBlueprint(): this {
		this.createMesh();
		debugger;
		return this;
	}

	public update(params: EntityParameters<this>): void {
		this._update(params);
	}
	public setup() {
		this._setup();
		console.log('setup');
	}
	public destroy(): void {
		throw new Error("Method not implemented.");
	}

}

export type NewBoxType = Omit<ZylemNewBox, '_update' | 'createFromBlueprint'>;

export function NewBox(initializer: () => ZylemNewBoxOptions): NewBoxType {
	const NewBoxWithMesh = BoxMesh(ZylemNewBox);
	return new NewBoxWithMesh(initializer) as NewBoxType;
}