import { Color, Group, Mesh, Object3D, Quaternion } from 'three';
import { Collider, KinematicCharacterController, RigidBody } from '@dimforge/rapier3d-compat';

import {
	CollisionOption,
	GameEntityOptions,
} from '../interfaces/entity';
import { EntityParameters } from './entity';
import { BaseEntity } from './base-entity';
import { state$ } from '../state';
import { ZylemStage } from './stage';

export interface IGameEntity {
	uuid: string;
	name: string;
	type: string;
	create: Function;
	group: Object3D;
	stageRef: ZylemStage | null;
	_custom: any;
	setup: Function;
	update: Function;
	destroy: Function;
}

export class GameEntity<T> extends BaseEntity<T> {
	public stageRef: ZylemStage | null = null;
	public group = new Group();
	public body: RigidBody | null = null;
	public controlledRotation = false;
	public characterController: null | KinematicCharacterController = null;
	public collider: null | Collider = null;
	public name: string = '';

	protected type: string = 'GameEntity';

	_collision: CollisionOption<T> | null = null;
	static counter = 0;

	constructor(options: GameEntityOptions<{ collision?: CollisionOption<T> }, T>) {
		super(options);
		this._collision = options.collision || null;
		this.setName(options.name);
	}

	private setName(name?: string) {
		GameEntity.counter++;
		const defaultName = `entity-${GameEntity.counter}`;
		this.name = name ?? defaultName ;
	}

	public create(): Promise<T> {
		throw new Error('Method not implemented.');
	}

	public setup(params: EntityParameters<T>) {
		super.setup(params);
	}

	public update(params: EntityParameters<T>): void {
		super.update(params);
		this.movement();
	}

	public destroy(params: EntityParameters<T>): void {
		super.destroy(params);
		if (this.body) {
			this.body.setEnabled(false);
		}
		if (this.stageRef) {
			this.stageRef.setForRemoval(this as IGameEntity);
		}
	}

	public collision(entity: GameEntity<T>, other: GameEntity<T>) {
		if (this._collision === null) {
			console.warn('_collision Method not implemented');
			return;
		}
		this._collision(entity, other, state$.globals);
	}

	public setColor(color: Color) {
		this.group.children.forEach((child) => {
			if (child instanceof (Mesh)) {
				child.material.color.set(color);
			}
		})
	}

	private movement() {
		if (!this.body) {
			return;
		}
		const { x, y, z } = this.body.translation();
		this.group.position.set(x, y, z);

		if (!this.controlledRotation) {
			const { x: rx, y: ry, z: rz, w: rw } = this.body.rotation();
			this.group.setRotationFromQuaternion(new Quaternion(rx, ry, rz, rw));
		}
	}
}
