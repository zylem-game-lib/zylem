import { BaseNode } from '../core/base-node';
import { DestroyFunction, SetupContext, SetupFunction, UpdateFunction } from '../core/base-node-life-cycle';
import { LoadingEvent, StageOptionItem, StageOptions, ZylemStage } from './zylem-stage';
import { ZylemCamera } from '../camera/zylem-camera';
import { CameraWrapper } from '../camera/camera';
import { stageState } from './stage-state';
import { getStageOptions } from './stage-default';

type NodeLike = { create: Function };
type AnyNode = NodeLike | Promise<NodeLike>;
type EntityInput = AnyNode | (() => AnyNode) | (() => Promise<any>);

export class Stage {
	wrappedStage: ZylemStage | null;
	options: StageOptionItem[] = [];

	// Lifecycle callback arrays
	private setupCallbacks: Array<SetupFunction<ZylemStage>> = [];
	private updateCallbacks: Array<UpdateFunction<ZylemStage>> = [];
	private destroyCallbacks: Array<DestroyFunction<ZylemStage>> = [];

	constructor(options: StageOptions) {
		this.options = options;
		this.wrappedStage = null;
	}

	async load(id: string, camera?: ZylemCamera | CameraWrapper | null) {
		stageState.entities = [];
		this.wrappedStage = new ZylemStage(this.options as StageOptions);
		this.wrappedStage.wrapperRef = this;

		const zylemCamera = camera instanceof CameraWrapper ? camera.cameraRef : camera;
		await this.wrappedStage!.load(id, zylemCamera);

		this.wrappedStage!.onEntityAdded((child) => {
			const next = this.wrappedStage!.buildEntityState(child);
			stageState.entities = [...stageState.entities, next];
		}, { replayExisting: true });

		// Apply lifecycle callbacks to wrapped stage
		this.applyLifecycleCallbacks();
	}

	private applyLifecycleCallbacks() {
		if (!this.wrappedStage) return;

		// Compose setup callbacks into a single function
		if (this.setupCallbacks.length > 0) {
			this.wrappedStage.setup = (params) => {
				const extended = { ...params, stage: this } as any;
				this.setupCallbacks.forEach(cb => cb(extended));
			};
		}

		// Compose update callbacks into a single function
		if (this.updateCallbacks.length > 0) {
			this.wrappedStage.update = (params) => {
				const extended = { ...params, stage: this } as any;
				this.updateCallbacks.forEach(cb => cb(extended));
			};
		}

		// Compose destroy callbacks into a single function
		if (this.destroyCallbacks.length > 0) {
			this.wrappedStage.destroy = (params) => {
				const extended = { ...params, stage: this } as any;
				this.destroyCallbacks.forEach(cb => cb(extended));
			};
		}
	}

	async addEntities(entities: BaseNode[]) {
		this.options.push(...(entities as unknown as StageOptionItem[]));
		// TODO: this check is unnecessary
		if (!this.wrappedStage) { return; }
		this.wrappedStage!.enqueue(...entities);
	}

	add(...inputs: Array<EntityInput>) {
		this.addToBlueprints(...inputs);
		this.addToStage(...inputs);
	}

	private addToBlueprints(...inputs: Array<EntityInput>) {
		if (this.wrappedStage) { return; }
		this.options.push(...(inputs as unknown as StageOptionItem[]));
	}

	private addToStage(...inputs: Array<EntityInput>) {
		if (!this.wrappedStage) { return; }
		this.wrappedStage!.enqueue(...(inputs as any));
	}

	start(params: SetupContext<ZylemStage>) {
		this.wrappedStage?.nodeSetup(params);
	}

	// Fluent API for adding lifecycle callbacks
	onUpdate(...callbacks: UpdateFunction<ZylemStage>[]): this {
		this.updateCallbacks.push(...callbacks);
		// If already loaded, recompose the update callback
		if (this.wrappedStage) {
			this.wrappedStage.update = (params) => {
				const extended = { ...params, stage: this } as any;
				this.updateCallbacks.forEach(cb => cb(extended));
			};
		}
		return this;
	}

	onSetup(...callbacks: SetupFunction<ZylemStage>[]): this {
		this.setupCallbacks.push(...callbacks);
		// If already loaded, recompose the setup callback
		if (this.wrappedStage) {
			this.wrappedStage.setup = (params) => {
				const extended = { ...params, stage: this } as any;
				this.setupCallbacks.forEach(cb => cb(extended));
			};
		}
		return this;
	}

	onDestroy(...callbacks: DestroyFunction<ZylemStage>[]): this {
		this.destroyCallbacks.push(...callbacks);
		// If already loaded, recompose the destroy callback
		if (this.wrappedStage) {
			this.wrappedStage.destroy = (params) => {
				const extended = { ...params, stage: this } as any;
				this.destroyCallbacks.forEach(cb => cb(extended));
			};
		}
		return this;
	}

	onLoading(callback: (event: LoadingEvent) => void) {
		if (!this.wrappedStage) { return () => { }; }
		return this.wrappedStage.onLoading(callback);
	}
}

/**
 * Create a stage with optional camera
 */
export function createStage(...options: StageOptions): Stage {
	const _options = getStageOptions(options);
	return new Stage([..._options] as StageOptions);
}