import type {
	BehaviorDescriptor,
	BehaviorHandle,
	BehaviorRef,
} from '../behaviors/behavior-descriptor';

/**
 * Minimal, runtime-agnostic entity options contract.
 *
 * The full engine entity (in `@zylem/game-lib`) provides a richer options type,
 * but behaviors only rely on this loose shape.
 */
export interface GameEntityOptions {
	[key: string]: any;
	name?: string;
}

/**
 * Structural stand-in for the engine `GameEntity`.
 *
 * Behaviors annotate against this loose contract so that `@zylem/behavior-core`
 * (and therefore `@zylem/behaviors`) never has to depend on the concrete
 * `@zylem/game-lib` entity implementation. The real engine entity is
 * structurally assignable to this type.
 */
export class GameEntity<TOptions = unknown> {
	[key: string]: any;

	uuid!: string;
	name!: string;
	type!: string;
	options?: TOptions & Record<string, unknown>;
	group: any = null;
	mesh?: any;
	materials?: any[];
	body: any = null;
	collider: any = null;
	colliderDesc?: any;
	colliderDescs: any[] = [];
	bodyDesc?: any;
	physicsAttached = false;
	runtimeHandle?: number;
	transformStore?: any;
	nodeDestroy?: any;
	isInstanced?: boolean;

	private __behaviorRefs: BehaviorRef<any>[] = [];

	create(): this {
		return this;
	}

	onCleanup(callback: () => void): this {
		void callback;
		return this;
	}

	setPosition(_x: number, _y: number, _z: number): void {}
	setRotation(_x: number, _y: number, _z: number): void {}
	setRotationZ(_z: number): void {}
	setScale(_x: number, _y: number, _z: number): void {}

	/**
	 * Attach a behavior to this entity. The real engine entity does substantially
	 * more, but this functional stub stores the merged ref and builds the handle
	 * so descriptor/handle logic (and tests that drive behaviors directly) work
	 * without the full engine.
	 */
	use<
		O extends Record<string, any>,
		H extends Record<string, any> = Record<string, never>,
	>(
		descriptor: BehaviorDescriptor<O, H>,
		options?: Partial<O>,
	): BehaviorHandle<O, H> {
		const mergedOptions = {
			...(descriptor.defaultOptions as O),
			...(options ?? {}),
		} as O;
		const ref: BehaviorRef<O> = { descriptor, options: mergedOptions };
		this.__behaviorRefs.push(ref as BehaviorRef<any>);

		const baseHandle = {
			getFSM: () => ref.fsm ?? null,
			getOptions: () => ref.options,
			ref,
		};
		const extra = descriptor.createHandle
			? descriptor.createHandle(ref)
			: ({} as H);
		return { ...baseHandle, ...extra } as BehaviorHandle<O, H>;
	}

	/** Live behavior refs attached via {@link use}. */
	getBehaviorRefs(): BehaviorRef<any>[] {
		return this.__behaviorRefs;
	}
}

/**
 * Factory contract injected into behavior systems via
 * {@link BehaviorSystemContext.createEntity}. The host engine supplies the real
 * entity factory at stage-construction time.
 */
export type CreateEntityFn = (
	options?: Partial<GameEntityOptions>,
) => GameEntity<GameEntityOptions>;
