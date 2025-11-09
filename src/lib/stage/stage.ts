import { BaseNode } from '../core/base-node';
import { DestroyFunction, SetupContext, SetupFunction, UpdateFunction } from '../core/base-node-life-cycle';
import { StageOptionItem, StageOptions, ZylemStage } from './zylem-stage';
import { ZylemCamera } from '../camera/zylem-camera';
import { CameraWrapper } from '../camera/camera';
import { getStageVariable, setStageVariable, stageState } from './stage-state';
import { getStageOptions } from './stage-default';

type NodeLike = { create: Function };
type AnyNode = NodeLike | Promise<NodeLike>;
type EntityInput = AnyNode | (() => AnyNode) | (() => Promise<any>);

export class Stage {
	stageRef: ZylemStage;
	options: StageOptionItem[] = [];

	update: UpdateFunction<ZylemStage> = () => { };
	setup: SetupFunction<ZylemStage> = () => { };
	destroy: DestroyFunction<ZylemStage> = () => { };

	constructor(options: StageOptions) {
		this.options = options;
		this.stageRef = new ZylemStage(this.options as StageOptions);
	}

	async load(id: string, camera?: ZylemCamera | CameraWrapper | null) {
		this.stageRef.wrapperRef = this;
		const zylemCamera = camera instanceof CameraWrapper ? camera.cameraRef : camera;

		await this.stageRef.load(id, zylemCamera);
	}

	async addEntities(entities: BaseNode[]) {
		this.options.push(...(entities as unknown as StageOptionItem[]));
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

/**
 * Create a stage with optional camera
 */
export function stage(...options: StageOptions): Stage {
	const _options = getStageOptions(options);
	return new Stage([..._options] as StageOptions);
}