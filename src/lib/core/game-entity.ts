import { Group, Quaternion } from 'three';
import { DestroyFunction, GameEntityOptions, OptionalVector, SetupFunction, UpdateFunction } from '../interfaces/entity';
import { Entity, LifecycleParameters, UpdateParameters } from './entity';
import { RigidBody } from '@dimforge/rapier3d-compat';

export class GameEntity extends Entity {
	protected type: string;
	protected _setup: SetupFunction<GameEntity>;
	protected _destroy: DestroyFunction<GameEntity>;
	protected _update: UpdateFunction<GameEntity>;
	protected group = new Group();
	protected body: RigidBody | null = null;

	constructor(options: GameEntityOptions<GameEntity>) {
		super();
		this.type = GameEntity.name;
		this._update = options.update;
		this._setup = options.setup;
		this._destroy = options.destroy;
	}

	public createFromBlueprint(): this {
		throw new Error('Method not implemented.');
	}

	public setup(params: LifecycleParameters<this>) {
		console.log(params);
	}

	public update(params: UpdateParameters<this>): void {
		this.movement();
	}

	private movement() {
		if (!this.body) {
			return;
		}
		const { x, y, z } = this.body.translation();
		const { x: rx, y: ry, z: rz, w: rw } = this.body.rotation();

		this.group.position.set(x, y, z);
		this.group.setRotationFromQuaternion(new Quaternion(rx, ry, rz, rw));
	}

	public destroy(params: LifecycleParameters<this>): void {
		console.log(params);
		this.removeFromScene();
	}

	private removeFromScene() {
		this.body?.setEnabled(false);
		this.group.removeFromParent();
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
