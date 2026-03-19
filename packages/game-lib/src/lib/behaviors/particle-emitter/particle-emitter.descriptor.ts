import type { IWorld } from 'bitecs';
import { Group, Object3D, Quaternion, Vector3 } from 'three';
import {
	BatchedRenderer,
	ParticleSystem,
	type ParticleSystemEvent,
} from 'three.quarks';

import { defineBehavior, type BehaviorRef } from '../behavior-descriptor';
import type { BehaviorEntityLink, BehaviorSystem } from '../behavior-system';
import { VEC3_ZERO, type Vec3Input, normalizeVec3, toThreeVector3 } from '../../core/vector';
import { getGlobals } from '../../game/game-state';
import type { ParticleEffectDefinition } from './particle-effect';

export interface ParticleEmitterBehaviorOptions {
	effect: ParticleEffectDefinition;
	autoplay: boolean;
	localOffset?: Vec3Input;
	followPosition: boolean;
	followRotation: boolean;
	autoDestroy: boolean;
}

export interface ParticleEmitterHandle {
	play(): void;
	stop(): void;
	pause(): void;
	restart(): void;
	burst(): void;
	isPlaying(): boolean;
	getSystem(): ParticleSystem | null;
}

type DesiredParticleState = 'playing' | 'paused' | 'stopped';

interface ParticleEmitterControlState {
	desiredState: DesiredParticleState;
	pendingRestart: boolean;
	runtime: ParticleEmitterRuntime | null;
}

interface ParticleEmitterRuntime {
	system: ParticleSystem;
	anchor: Group;
	service: ParticleRendererService;
	initialPosition: Vector3;
	initialQuaternion: Quaternion;
	onDestroy: (event: ParticleSystemEvent) => void;
}

interface ParticleEmitterHostEntity {
	uuid: string;
	name?: string;
	body?: {
		translation(): { x: number; y: number; z: number };
		rotation?(): { x: number; y: number; z: number; w: number };
	} | null;
	group?: Object3D | null;
	mesh?: Object3D | null;
	options?: {
		position?: Vec3Input;
	};
	markedForRemoval?: boolean;
	nodeDestroy?(params: { me: unknown; globals: unknown }): void;
	__zylemParticleSystemEntity?: boolean;
}

const PARTICLE_EMITTER_BEHAVIOR_KEY = Symbol.for(
	'zylem:behavior:particle-emitter',
);

const DEFAULT_PARTICLE_EFFECT: ParticleEffectDefinition = {
	create() {
		throw new Error(
			'ParticleEmitterBehavior requires an effect definition created with particleEffect(...).',
		);
	},
};

const defaultOptions: ParticleEmitterBehaviorOptions = {
	effect: DEFAULT_PARTICLE_EFFECT,
	autoplay: true,
	localOffset: undefined,
	followPosition: true,
	followRotation: true,
	autoDestroy: false,
};

class ParticleRendererService {
	readonly renderer = new BatchedRenderer();
	private readonly systems = new Set<ParticleSystem>();

	constructor(private readonly sceneRoot: Object3D) {
		this.renderer.name = 'zylem-particle-batch-renderer';
		this.sceneRoot.add(this.renderer);
	}

	register(system: ParticleSystem): void {
		if (this.systems.has(system)) {
			return;
		}
		this.renderer.addSystem(system);
		this.systems.add(system);
	}

	forget(system: ParticleSystem): void {
		this.systems.delete(system);
	}

	update(delta: number): void {
		this.renderer.update(delta);
	}

	destroy(): void {
		this.systems.clear();
		this.renderer.removeFromParent();
	}
}

function getParticleControlState(
	ref: BehaviorRef<ParticleEmitterBehaviorOptions>,
): ParticleEmitterControlState {
	const runtimeState = (ref as any).__particleEmitterControlState as
		| ParticleEmitterControlState
		| undefined;
	if (runtimeState) {
		return runtimeState;
	}

	const nextState: ParticleEmitterControlState = {
		desiredState: ref.options.autoplay ? 'playing' : 'stopped',
		pendingRestart: false,
		runtime: null,
	};
	(ref as any).__particleEmitterControlState = nextState;
	return nextState;
}

function shouldCreateRuntime(
	state: ParticleEmitterControlState,
): boolean {
	return state.runtime == null
		&& (state.desiredState !== 'stopped' || state.pendingRestart);
}

function getLocalOffset(options: ParticleEmitterBehaviorOptions): Vector3 {
	return toThreeVector3(options.localOffset, VEC3_ZERO);
}

function readHostTransform(entity: ParticleEmitterHostEntity): {
	position: Vector3;
	quaternion: Quaternion;
} {
	if (entity.body?.translation) {
		const position = entity.body.translation();
		const rotation = entity.body.rotation?.() ?? { x: 0, y: 0, z: 0, w: 1 };
		return {
			position: new Vector3(position.x, position.y, position.z),
			quaternion: new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w),
		};
	}

	const visualRoot = entity.group ?? entity.mesh;
	if (visualRoot) {
		const position = new Vector3();
		const quaternion = new Quaternion();
		visualRoot.getWorldPosition(position);
		visualRoot.getWorldQuaternion(quaternion);
		return { position, quaternion };
	}

	const position = normalizeVec3(entity.options?.position, VEC3_ZERO);
	return {
		position: new Vector3(position.x, position.y, position.z),
		quaternion: new Quaternion(),
	};
}

function syncRuntimeTransform(
	entity: ParticleEmitterHostEntity,
	ref: BehaviorRef<ParticleEmitterBehaviorOptions>,
	runtime: ParticleEmitterRuntime,
): void {
	const current = readHostTransform(entity);
	const options = ref.options;
	const basePosition = options.followPosition
		? current.position
		: runtime.initialPosition;
	const baseQuaternion = options.followRotation
		? current.quaternion
		: runtime.initialQuaternion;
	const offset = getLocalOffset(options);

	if (options.followRotation) {
		offset.applyQuaternion(baseQuaternion);
	}

	runtime.anchor.position.copy(basePosition).add(offset);
	runtime.anchor.quaternion.copy(baseQuaternion);
}

function applyRuntimeState(
	ref: BehaviorRef<ParticleEmitterBehaviorOptions>,
): void {
	const state = getParticleControlState(ref);
	const runtime = state.runtime;
	if (!runtime) {
		return;
	}

	if (state.pendingRestart) {
		runtime.system.restart();
		state.pendingRestart = false;
	}

	if (state.desiredState === 'paused') {
		runtime.system.pause();
		return;
	}

	if (state.desiredState === 'stopped') {
		runtime.system.stop();
		return;
	}

	runtime.system.play();
}

function releaseRuntime(
	ref: BehaviorRef<ParticleEmitterBehaviorOptions>,
	reason: 'manual' | 'system-destroyed',
): void {
	const state = getParticleControlState(ref);
	const runtime = state.runtime;
	if (!runtime) {
		return;
	}

	state.runtime = null;
	state.pendingRestart = false;

	runtime.system.removeEventListener('destroy', runtime.onDestroy);
	runtime.service.forget(runtime.system);

	if (reason === 'manual') {
		runtime.system.dispose();
	}

	runtime.anchor.removeFromParent();
}

function handleSystemDestroyed(
	entity: ParticleEmitterHostEntity,
	ref: BehaviorRef<ParticleEmitterBehaviorOptions>,
): void {
	releaseRuntime(ref, 'system-destroyed');
	const state = getParticleControlState(ref);
	state.desiredState = 'stopped';

	if (
		ref.options.autoDestroy
		&& entity.__zylemParticleSystemEntity
		&& !entity.markedForRemoval
	) {
		entity.nodeDestroy?.({ me: entity, globals: getGlobals() });
	}
}

function createRuntime(
	entity: ParticleEmitterHostEntity,
	ref: BehaviorRef<ParticleEmitterBehaviorOptions>,
	service: ParticleRendererService,
): ParticleEmitterRuntime {
	const system = ref.options.effect.create();
	const anchor = new Group();
	const initialTransform = readHostTransform(entity);
	const runtime: ParticleEmitterRuntime = {
		system,
		anchor,
		service,
		initialPosition: initialTransform.position.clone(),
		initialQuaternion: initialTransform.quaternion.clone(),
		onDestroy: () => handleSystemDestroyed(entity, ref),
	};

	anchor.name = `${entity.name || entity.uuid}:particle-anchor`;
	system.autoDestroy = ref.options.autoDestroy;
	anchor.add(system.emitter);
	service.register(system);
	service.renderer.parent?.add(anchor);
	system.addEventListener('destroy', runtime.onDestroy);

	syncRuntimeTransform(entity, ref, runtime);
	return runtime;
}

function createParticleEmitterHandle(
	ref: BehaviorRef<ParticleEmitterBehaviorOptions>,
): ParticleEmitterHandle {
	return {
		play: () => {
			const state = getParticleControlState(ref);
			state.desiredState = 'playing';
			applyRuntimeState(ref);
		},
		stop: () => {
			const state = getParticleControlState(ref);
			state.desiredState = 'stopped';
			state.pendingRestart = false;
			applyRuntimeState(ref);
		},
		pause: () => {
			const state = getParticleControlState(ref);
			state.desiredState = 'paused';
			applyRuntimeState(ref);
		},
		restart: () => {
			const state = getParticleControlState(ref);
			state.desiredState = 'playing';
			state.pendingRestart = true;
			applyRuntimeState(ref);
		},
		burst: () => {
			const state = getParticleControlState(ref);
			state.desiredState = 'playing';
			state.pendingRestart = true;
			applyRuntimeState(ref);
		},
		isPlaying: () => {
			const runtime = getParticleControlState(ref).runtime;
			if (!runtime) {
				return getParticleControlState(ref).desiredState === 'playing';
			}
			return !runtime.system.paused;
		},
		getSystem: () => getParticleControlState(ref).runtime?.system ?? null,
	};
}

class ParticleEmitterBehaviorSystem implements BehaviorSystem {
	private rendererService: ParticleRendererService | null = null;

	constructor(
		private readonly scene: { scene: Object3D },
		private readonly getBehaviorLinks?: (key: symbol) => Iterable<BehaviorEntityLink>,
	) {}

	private getRendererService(): ParticleRendererService {
		if (!this.rendererService) {
			this.rendererService = new ParticleRendererService(this.scene.scene);
		}
		return this.rendererService;
	}

	update(_ecs: IWorld, delta: number): void {
		const links = this.getBehaviorLinks?.(PARTICLE_EMITTER_BEHAVIOR_KEY);
		if (!links) {
			return;
		}

		let hasRuntime = false;
		let rendererService = this.rendererService;

		for (const link of links) {
			const entity = link.entity as ParticleEmitterHostEntity;
			const ref = link.ref as BehaviorRef<ParticleEmitterBehaviorOptions>;
			const state = getParticleControlState(ref);

			if (shouldCreateRuntime(state)) {
				try {
					rendererService ??= this.getRendererService();
					state.runtime = createRuntime(entity, ref, rendererService);
				} catch (error) {
					state.desiredState = 'stopped';
					state.pendingRestart = false;
					console.error('Failed to create particle runtime:', error);
					continue;
				}
			}

			if (!state.runtime) {
				continue;
			}

			hasRuntime = true;
			syncRuntimeTransform(entity, ref, state.runtime);
			applyRuntimeState(ref);
		}

		if (hasRuntime && rendererService) {
			rendererService.update(delta);
		}
	}

	detach(link: BehaviorEntityLink): void {
		releaseRuntime(
			link.ref as BehaviorRef<ParticleEmitterBehaviorOptions>,
			'manual',
		);
	}

	destroy(_ecs: IWorld): void {
		const links = this.getBehaviorLinks?.(PARTICLE_EMITTER_BEHAVIOR_KEY);
		if (links) {
			for (const link of links) {
				releaseRuntime(
					link.ref as BehaviorRef<ParticleEmitterBehaviorOptions>,
					'manual',
				);
			}
		}

		this.rendererService?.destroy();
		this.rendererService = null;
	}
}

export const ParticleEmitterBehavior = defineBehavior<
	ParticleEmitterBehaviorOptions,
	ParticleEmitterHandle
>({
	name: 'particle-emitter',
	defaultOptions,
	systemFactory: (ctx) =>
		new ParticleEmitterBehaviorSystem(ctx.scene, ctx.getBehaviorLinks),
	createHandle: createParticleEmitterHandle,
});
