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
	wrappedStage: ZylemStage | null;
	options: StageOptionItem[] = [];

	update: UpdateFunction<ZylemStage> = () => { };
	setup: SetupFunction<ZylemStage> = () => { };
	destroy: DestroyFunction<ZylemStage> = () => { };

	constructor(options: StageOptions) {
		this.options = options;
		this.wrappedStage = null;
	}

	async load(id: string, camera?: ZylemCamera | CameraWrapper | null) {
		this.wrappedStage = new ZylemStage(this.options as StageOptions);
		this.wrappedStage.wrapperRef = this;

		const zylemCamera = camera instanceof CameraWrapper ? camera.cameraRef : camera;
		await this.wrappedStage!.load(id, zylemCamera);
	}

	async addEntities(entities: BaseNode[]) {
		this.options.push(...(entities as unknown as StageOptionItem[]));
		// TODO: this check is unnecessary
		if (!this.wrappedStage) { return; }
		this.wrappedStage!.enqueue(...entities);
	}

	add(...inputs: Array<EntityInput>) {
		this.wrappedStage!.enqueue(...(inputs as any));
	}

	start(params: SetupContext<ZylemStage>) {
		this.wrappedStage?.nodeSetup(params);
		this.wrappedStage!.onEntityAdded((child) => {
			const next = this.wrappedStage!.buildEntityState(child);
			stageState.entities = [...stageState.entities, next];
		}, { replayExisting: true });
	}

	onUpdate(...callbacks: UpdateFunction<ZylemStage>[]) {
		this.wrappedStage!.update = (params) => {
			const extended = { ...params, stage: this } as any;
			callbacks.forEach((cb) => cb(extended));
		};
	}

	onSetup(callback: SetupFunction<ZylemStage>) {
		this.wrappedStage!.setup = callback;
	}

	onDestroy(callback: DestroyFunction<ZylemStage>) {
		this.wrappedStage!.destroy = callback;
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