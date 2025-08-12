import { BaseNode } from '../core/base-node';
import { DestroyFunction, SetupContext, SetupFunction, UpdateFunction } from '../core/base-node-life-cycle';
import { StageOptions, ZylemStage } from './zylem-stage';
import { ZylemCamera } from '../camera/zylem-camera';
import { CameraWrapper } from '../camera/camera';
import { subscribe } from 'valtio/vanilla';
import { setEntitiesToStage, setStageVariable, stageState } from './stage-state';
import { BaseEntityInterface } from '../types';
import { GameEntity } from '../entities/entity';

export class Stage {
	stageRef: ZylemStage;
	options: StageOptions = [];

	update: UpdateFunction<ZylemStage> = () => { };
	setup: SetupFunction<ZylemStage> = () => { };
	destroy: DestroyFunction<ZylemStage> = () => { };

	constructor(options: StageOptions) {
		this.options = options;
		this.stageRef = new ZylemStage(this.options);
	}

	async load(id: string, camera?: ZylemCamera | CameraWrapper | null) {
		this.stageRef.wrapperRef = this;
		const zylemCamera = camera instanceof CameraWrapper ? camera.cameraRef : camera;

		await this.stageRef.load(id, zylemCamera);
	}

	async addEntities(entities: BaseNode[]) {
		this.options.push(...entities);
		this.stageRef.children = [...this.stageRef.children, ...entities];
	}

	start(params: SetupContext<ZylemStage>) {
		this.stageRef?.setup(params);
		const stateEntities = this.stageRef.children.map((child) => {
			if (child instanceof GameEntity) {
				return { ...child.buildInfo() } as Partial<BaseEntityInterface>
			}
			return {
				uuid: child.uuid,
				name: child.name,
				eid: child.eid,
			};
		});
		setEntitiesToStage(stateEntities);
	}

	onUpdate(...callbacks: UpdateFunction<ZylemStage>[]) {
		this.stageRef._update = (params) => {
			callbacks.forEach((cb) => cb(params));
		};
	}

	onSetup(callback: SetupFunction<ZylemStage>) {
		this.stageRef._setup = callback;
	}

	onDestroy(callback: DestroyFunction<ZylemStage>) {
		this.stageRef._destroy = callback;
	}

	setVariable(key: string, value: any) {
		setStageVariable(key, value);
	}

	getVariable(key: string) {
		return this.stageRef.state.variables[key];
	}

	watchVariable(key: string, callback: (value: any) => void) {
		subscribe(stageState, () => {
			if (stageState.variables[key] !== undefined) {
				callback(stageState.variables[key]);
			}
		});
	}
}

/**
 * Create a stage with optional camera
 */
export function stage(...options: StageOptions): Stage {
	return new Stage(options);
}