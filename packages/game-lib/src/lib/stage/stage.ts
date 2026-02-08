import { BaseNode } from '../core/base-node';
import { DestroyFunction, SetupContext, SetupFunction, UpdateFunction } from '../core/base-node-life-cycle';
import { LoadingEvent, StageOptionItem, StageOptions, ZylemStage } from './zylem-stage';
import { ZylemCamera } from '../camera/zylem-camera';
import { CameraWrapper } from '../camera/camera';
import { stageState } from './stage-state';
import { getStageOptions } from './stage-default';
import { EntityTypeMap } from '../types/entity-type-map';
import { EventEmitterDelegate, zylemEventBus, type StageEvents } from '../events';
import { GameInputConfig } from '../game/game-interfaces';
import { mergeInputConfigs } from '../input/input-presets';

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

	// Event delegate for dispatch/listen API
	private eventDelegate = new EventEmitterDelegate<StageEvents>();

	/** Per-stage input configuration overrides. Merged with game-level defaults on stage load. */
	inputConfig: GameInputConfig | null = null;

	/**
	 * Callback set by the game to trigger input reconfiguration
	 * when this stage's input config changes at runtime.
	 * @internal
	 */
	onInputConfigChanged: (() => void) | null = null;

	constructor(options: StageOptions) {
		this.options = options;
		this.wrappedStage = null;
	}

	/**
	 * Set composable input configuration for this stage.
	 * Multiple configs are deep-merged (later configs win on key conflicts).
	 * If this stage is currently active, the change takes effect immediately.
	 * @example stage.setInputConfiguration(useArrowsForAxes('p1'), useWASDForDirections('p2'));
	 */
	setInputConfiguration(...configs: GameInputConfig[]): this {
		this.inputConfig = mergeInputConfigs(...configs);
		if (this.onInputConfigChanged) {
			this.onInputConfigChanged();
		}
		return this;
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

	/**
	 * Find an entity by name on the current stage.
	 * @param name The name of the entity to find
	 * @param type Optional type symbol for type inference (e.g., TEXT_TYPE, SPRITE_TYPE)
	 * @returns The entity if found, or undefined
	 * @example stage.getEntityByName('scoreText', TEXT_TYPE)
	 */
	getEntityByName<T extends symbol | void = void>(
		name: string,
		type?: T
	): T extends keyof EntityTypeMap ? EntityTypeMap[T] | undefined : BaseNode | undefined {
		const entity = this.wrappedStage?.children.find(c => c.name === name);
		return entity as any;
	}

	// ─────────────────────────────────────────────────────────────────────────────
	// Events API
	// ─────────────────────────────────────────────────────────────────────────────

	/**
	 * Dispatch an event from the stage.
	 * Events are emitted both locally and to the global event bus.
	 */
	dispatch<K extends keyof StageEvents>(event: K, payload: StageEvents[K]): void {
		this.eventDelegate.dispatch(event, payload);
		(zylemEventBus as any).emit(event, payload);
	}

	/**
	 * Listen for events on this stage instance.
	 * @returns Unsubscribe function
	 */
	listen<K extends keyof StageEvents>(event: K, handler: (payload: StageEvents[K]) => void): () => void {
		return this.eventDelegate.listen(event, handler);
	}

	/**
	 * Clean up stage resources including event subscriptions.
	 */
	dispose(): void {
		this.eventDelegate.dispose();
	}
}

/**
 * Create a stage with optional camera
 */
export function createStage(...options: StageOptions): Stage {
	const _options = getStageOptions(options);
	return new Stage([..._options] as StageOptions);
}