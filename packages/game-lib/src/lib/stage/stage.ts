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
	// Entities added after construction, consumed on each load
	private _pendingEntities: BaseNode[] = [];

	// Lifecycle callback arrays
	private setupCallbacks: Array<SetupFunction<ZylemStage>> = [];
	private updateCallbacks: Array<UpdateFunction<ZylemStage>> = [];
	private destroyCallbacks: Array<DestroyFunction<ZylemStage>> = [];
	private pendingLoadingCallbacks: Array<(event: LoadingEvent) => void> = [];

	constructor(options: StageOptions) {
		this.options = options;
		this.wrappedStage = null;
	}

	async load(id: string, camera?: ZylemCamera | CameraWrapper | null) {
		stageState.entities = [];
		// Combine original options with pending entities, then clear pending
		const loadOptions = [...this.options, ...this._pendingEntities] as StageOptions;
		this._pendingEntities = [];
		
		this.wrappedStage = new ZylemStage(loadOptions);
		this.wrappedStage.wrapperRef = this;

		// Flush pending loading callbacks BEFORE load so we catch start/progress events
		this.pendingLoadingCallbacks.forEach(cb => {
			this.wrappedStage!.onLoading(cb);
		});
		this.pendingLoadingCallbacks = [];

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

		// Compose update callbacks
		if (this.updateCallbacks.length > 0) {
			this.wrappedStage.update = (params) => {
				const extended = { ...params, stage: this } as any;
				this.updateCallbacks.forEach(cb => cb(extended));
			};
		}

		// Compose destroy callbacks
		if (this.destroyCallbacks.length > 0) {
			this.wrappedStage.destroy = (params) => {
				const extended = { ...params, stage: this } as any;
				this.destroyCallbacks.forEach(cb => cb(extended));
			};
		}
	}

	async addEntities(entities: BaseNode[]) {
		// Store in pending, don't mutate options
		this._pendingEntities.push(...entities);
		if (!this.wrappedStage) { return; }
		this.wrappedStage!.enqueue(...entities);
	}

	add(...inputs: Array<EntityInput>) {
		this.addToBlueprints(...inputs);
		this.addToStage(...inputs);
	}

	private addToBlueprints(...inputs: Array<EntityInput>) {
		if (this.wrappedStage) { return; }
		// Add to options (persistent) so they're available on reload
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
		if (!this.wrappedStage) { 
			this.pendingLoadingCallbacks.push(callback);
			return () => {
				this.pendingLoadingCallbacks = this.pendingLoadingCallbacks.filter(c => c !== callback);
			};
		}
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