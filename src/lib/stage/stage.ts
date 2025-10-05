import { BaseNode } from '../core/base-node';
import { DestroyFunction, SetupContext, SetupFunction, UpdateFunction } from '../core/base-node-life-cycle';
import { StageOptions, ZylemStage } from './zylem-stage';
import { ZylemCamera } from '../camera/zylem-camera';
import { CameraWrapper } from '../camera/camera';
import { getStageVariable, setStageVariable, stageState } from './stage-state';

type NodeLike = { create: Function };
type AnyNode = NodeLike | Promise<NodeLike>;
type EntityInput = AnyNode | (() => AnyNode) | (() => Promise<any>);

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
		this.stageRef.enqueue(...entities);
	}

	add(...inputs: Array<EntityInput>) {
		this.stageRef.enqueue(...(inputs as any));
	}

	start(params: SetupContext<ZylemStage>) {
		this.stageRef?.nodeSetup(params);
		this.stageRef.onEntityAdded((child) => {
			const next = this.stageRef.buildEntityState(child);
			stageState.entities = [...stageState.entities, next];
		}, { replayExisting: true });
	}

	onUpdate(...callbacks: UpdateFunction<ZylemStage>[]) {
		this.stageRef.update = (params) => {
			const extended = { ...params, stage: this } as any;
			callbacks.forEach((cb) => cb(extended));
		};
	}

	onSetup(callback: SetupFunction<ZylemStage>) {
		this.stageRef.setup = callback;
	}

	onDestroy(callback: DestroyFunction<ZylemStage>) {
		this.stageRef.destroy = callback;
	}

	setVariable(key: string, value: any) {
		setStageVariable(key, value);
	}

	getVariable(key: string) {
		return getStageVariable(key);
	}
}

export interface StageContext {
	instance: Stage; // TODO: make this a factory function
	stageBlueprint: StageOptions;
}

/**
 * Create a stage with optional camera
 */
export function stage(...options: StageOptions): Stage {
	return new Stage(options);
}