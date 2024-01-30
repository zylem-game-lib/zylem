import { Group } from 'three';
import { GameEntityOptions, OptionalVector, UpdateFunction } from '../interfaces/entity';
import { Entity, EntityParameters } from './entity';

export class GameEntity extends Entity {
	protected type: string;
	protected _setup: () => void;
	protected _update: UpdateFunction<GameEntity>;
	protected group = new Group();

	constructor(options: GameEntityOptions<GameEntity>) {
		super();
		this.type = GameEntity.name;
		this._update = options.update;
		this._setup = options.setup;
	}

	public createFromBlueprint(): this {
		throw new Error('Method not implemented.');
	}

	public setup() {
		super.setup();
	}

	public update(params: EntityParameters<this>): void {
		super.update(params);
	}

	public destroy(): void {
		throw new Error("Method not implemented.");
	}

	// TODO: unfortunately we might need to take into account whether the game is 2d or 3d
	// in 2D the only rotations that occur are around the Z axis
	public spawnRelative(T: any, options: any, offset: OptionalVector) {
		// const stage = this.stageRef;
		// const { x, y, z } = this.body.translation();
		// const rz = this._rotation2DAngle;
		// const offsetX = Math.sin(-rz) * (offset.x ?? 0);
		// const offsetY = Math.cos(-rz) * (offset.y ?? 0);
		// options.position = new Vector3(x + offsetX, y + offsetY, z + (offset.z ?? 0));
		// stage?.spawnEntity(T(options));
	}

}
