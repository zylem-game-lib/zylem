import { Color, Group, Mesh, Quaternion } from 'three';
import {
	CollisionOption,
	GameEntityOptions,
} from '../interfaces/entity';
import { EntityParameters } from './entity';
import { Collider, KinematicCharacterController, RigidBody } from '@dimforge/rapier3d-compat';
import { EntityBehavior } from '../behaviors/behavior';
import { BaseEntity } from './base-entity';
import { state$ } from '../state';
import { ZylemStage } from './stage';

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
		GameEntity.counter++;
		this.name = options.name || `entity-${GameEntity.counter}`;
	}

	protected createUuid(type: string) {
		this.type = type;
		this.uuid = `${this.type}-${this.uuid}`;
	}

	public createFromBlueprint(): Promise<any> {
		throw new Error('Method not implemented.');
	}

	public setup(_params: Partial<EntityParameters<any>>) { }

	public update(_params: EntityParameters<any>): void {
		this.movement();
	}

	public destroy(_params: EntityParameters<any>): void {
		if (this.body) {
			this.body.setEnabled(false);
		}
		if (this.stageRef) {
			this.stageRef.setForRemoval(this);
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

	// TODO: implement entity behaviors
	public use(behavior: EntityBehavior) {
		behavior.update();
	}

}
