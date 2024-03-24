import { Group, Quaternion } from 'three';
import {
	SetupFunction,
	UpdateFunction,
	DestroyFunction,
	GameEntityOptions,
} from '../interfaces/entity';
import { Entity, EntityParameters } from './entity';
import { RigidBody } from '@dimforge/rapier3d-compat';

export class GameEntity<T> implements Entity {
	public uuid: string;

	protected type: string = 'Entity';
	protected _setup: SetupFunction<T>;
	protected _update: UpdateFunction<T>;
	protected _destroy: DestroyFunction<T>;

	protected group = new Group();
	protected body: RigidBody | null = null;

	constructor(options: GameEntityOptions<{}, T>) {
		this.uuid = `${Math.random() * 999999}`; // TODO: use package for assigning uuid
		this._setup = options.setup;
		this._update = options.update;
		this._destroy = options.destroy;
	}

	protected createUuid(type: string) {
		this.type = type;
		this.uuid = `${this.type}-${this.uuid}`;
	}

	public createFromBlueprint(): Promise<any> {
		throw new Error('Method not implemented.');
	}

	public setup(_params: EntityParameters<any>) {
		this.createUuid(_params.entity.type);
	}

	public update(_params: EntityParameters<any>): void {
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

	public destroy(params: EntityParameters<any>): void {
		console.log(params);
		this.removeFromScene();
	}

	private removeFromScene() {
		this.body?.setEnabled(false);
		this.group.removeFromParent();
	}

}
