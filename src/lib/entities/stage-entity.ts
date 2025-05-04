import { Color, Group, Mesh, Object3D, Quaternion } from 'three';
import { Collider, KinematicCharacterController, RigidBody } from '@dimforge/rapier3d-compat';

import {
	CollisionOption,
} from '../interfaces/entity';
import { state$ } from '../state';
import { ZylemStage } from '../core/stage';
import { Behavior } from '../behaviors/behavior';
// import { Moveable } from '../behaviors/moveable';
import { applyMixins } from '../core/composable';

export interface IGameEntity {
	uuid: string;
	eid: number;
	name: string;
	type: string;
	create: Function;
	group: Object3D;
	stageRef: ZylemStage | null;
	_custom: any;
	_behaviors: Behavior[];
	setup: Function;
	update: Function;
	destroy: Function;
	_setup: Function;
	_update: Function;
	_destroy: Function;
}

// export interface StageEntity extends Moveable { }
export interface StageEntity extends IGameEntity { }

export class StageEntity {
	public stageRef: ZylemStage | null = null;
	public group = new Group();
	public mesh: Mesh | null = null;
	public instanceId: number = 0;

	public collider: null | Collider = null;
	public controlledRotation = false;
	public characterController: null | KinematicCharacterController = null;
	public name: string = '';

	_collision: CollisionOption | null = null;
	static counter = 0;

	public stageEntityDefaults() {
		this.group = new Group();
		// this._collision = options.collision || null;
		// this.setName(options.name);
	}

	private setName(name?: string) {
		StageEntity.counter++;
		const defaultName = `entity-${StageEntity.counter}`;
		this.name = name ?? defaultName;
	}

	public kill(params: any): void {
		if (this.body) {
			this.body.setEnabled(false);
		}
		if (this.stageRef) {
			this.stageRef.setForRemoval(this);
		}
	}

	public collision(entity: StageEntity, other: StageEntity) {
		if (this._collision === null) {
			console.warn('_collision Method not implemented');
			return;
		}
		this._collision(entity, other, state$.globals as any);
	}

	public setColor(color: Color) {
		this.group.children.forEach((child) => {
			if (child instanceof (Mesh)) {
				child.material.color.set(color);
			}
		});
	}
}

applyMixins(StageEntity, []);