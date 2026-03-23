import { Group, Quaternion, Vector3 } from 'three';

import type { BehaviorHandle, BehaviorRef } from '../behaviors/behavior-descriptor';
import {
	ParticleEmitterBehavior,
	type ParticleEmitterBehaviorOptions,
	type ParticleEmitterHandle,
} from '../behaviors/particle-emitter/particle-emitter.descriptor';
import type { ParticleEffectDefinition } from '../behaviors/particle-emitter/particle-effect';
import { deepMergeValues } from '../core/clone-utils';
import { toThreeVector3 } from '../core/vector';
import { commonDefaults } from './common';
import {
	finalizeEntityCloneSupport,
	GameEntity,
	type GameEntityOptions,
} from './entity';

export type ZylemParticleSystemOptions = GameEntityOptions
	& ParticleEmitterBehaviorOptions
	& {
		preset?: ParticleEffectDefinition;
	};

const particleSystemDefaults: ZylemParticleSystemOptions = {
	...commonDefaults,
	effect: {
		create() {
			throw new Error(
				'createParticleSystem(...) requires an effect or preset definition.',
			);
		},
	},
	preset: undefined,
	autoplay: true,
	localOffset: undefined,
	followPosition: true,
	followRotation: true,
	autoDestroy: false,
};

export const PARTICLE_SYSTEM_TYPE = Symbol('ParticleSystem');

function toBehaviorOptions(
	options: ZylemParticleSystemOptions,
): ParticleEmitterBehaviorOptions {
	return {
		effect: options.preset ?? options.effect,
		autoplay: options.autoplay,
		localOffset: options.localOffset,
		followPosition: options.followPosition,
		followRotation: options.followRotation,
		autoDestroy: options.autoDestroy,
	};
}

export class ZylemParticleSystem extends GameEntity<ZylemParticleSystemOptions> {
	static type = PARTICLE_SYSTEM_TYPE;

	declare __zylemParticleSystemEntity: true;

	private particleHandle: ParticleEmitterHandle | null = null;

	constructor(
		options?: Partial<ZylemParticleSystemOptions>,
		initializeBehavior = true,
	) {
		super();
		this.options = deepMergeValues(particleSystemDefaults, options);
		this.group = new Group();
		const position = this.options.position;
		if (position) {
			this.group.position.copy(toThreeVector3(position));
		}
		this.__zylemParticleSystemEntity = true;
		this.bindStandaloneTransforms();

		if (initializeBehavior) {
			this.particleHandle = this.use(
				ParticleEmitterBehavior,
				toBehaviorOptions(this.options),
			);
		}
	}

	private bindStandaloneTransforms(): void {
		const syncOptionsPosition = () => {
			this.options.position = new Vector3(
				this.group?.position.x ?? 0,
				this.group?.position.y ?? 0,
				this.group?.position.z ?? 0,
			) as any;
		};
		const syncOptionsRotation = () => {
			if (!this.group) {
				return;
			}
			(this as any)._rotation2DAngle = this.group.rotation.z;
		};

		this.setPosition = (x: number, y: number, z: number) => {
			this.group?.position.set(x, y, z);
			syncOptionsPosition();
		};
		this.setPositionX = (x: number) => {
			if (!this.group) return;
			this.group.position.x = x;
			syncOptionsPosition();
		};
		this.setPositionY = (y: number) => {
			if (!this.group) return;
			this.group.position.y = y;
			syncOptionsPosition();
		};
		this.setPositionZ = (z: number) => {
			if (!this.group) return;
			this.group.position.z = z;
			syncOptionsPosition();
		};
		this.getPosition = () => {
			if (!this.group) return null;
			return {
				x: this.group.position.x,
				y: this.group.position.y,
				z: this.group.position.z,
			} as any;
		};
		this.setRotation = (x: number, y: number, z: number) => {
			this.group?.rotation.set(x, y, z);
			syncOptionsRotation();
		};
		this.setRotationX = (x: number) => {
			if (!this.group) return;
			this.group.rotation.x = x;
			syncOptionsRotation();
		};
		this.setRotationY = (y: number) => {
			if (!this.group) return;
			this.group.rotation.y = y;
			syncOptionsRotation();
		};
		this.setRotationZ = (z: number) => {
			if (!this.group) return;
			this.group.rotation.z = z;
			syncOptionsRotation();
		};
		this.setRotationDegrees = (x: number, y: number, z: number) => {
			this.group?.rotation.set(
				(x * Math.PI) / 180,
				(y * Math.PI) / 180,
				(z * Math.PI) / 180,
			);
			syncOptionsRotation();
		};
		this.setRotationDegreesX = (x: number) => {
			if (!this.group) return;
			this.group.rotation.x = (x * Math.PI) / 180;
			syncOptionsRotation();
		};
		this.setRotationDegreesY = (y: number) => {
			if (!this.group) return;
			this.group.rotation.y = (y * Math.PI) / 180;
			syncOptionsRotation();
		};
		this.setRotationDegreesZ = (z: number) => {
			if (!this.group) return;
			this.group.rotation.z = (z * Math.PI) / 180;
			syncOptionsRotation();
		};
		this.rotateX = (delta: number) => {
			this.group?.rotateX(delta);
			syncOptionsRotation();
		};
		this.rotateY = (delta: number) => {
			this.group?.rotateY(delta);
			syncOptionsRotation();
		};
		this.rotateZ = (delta: number) => {
			this.group?.rotateZ(delta);
			syncOptionsRotation();
		};
		this.getRotation = () => {
			if (!this.group) return null;
			const rotation = new Quaternion();
			this.group.getWorldQuaternion(rotation);
			return rotation;
		};
	}

	private resolveParticleHandle():
		| (BehaviorHandle<ParticleEmitterBehaviorOptions, ParticleEmitterHandle>
			& ParticleEmitterHandle)
		| null {
		if (this.particleHandle) {
			return this.particleHandle as BehaviorHandle<
				ParticleEmitterBehaviorOptions,
				ParticleEmitterHandle
			> & ParticleEmitterHandle;
		}

		const ref = this.getBehaviorRefs().find(
			(candidate) => candidate.descriptor.key === ParticleEmitterBehavior.key,
		) as BehaviorRef<ParticleEmitterBehaviorOptions> | undefined;
		if (!ref) {
			return null;
		}

		const baseHandle = {
			getFSM: () => ref.fsm ?? null,
			getOptions: () => ref.options,
			ref,
		};
		const customMethods =
			ParticleEmitterBehavior.createHandle?.(ref) ?? ({} as ParticleEmitterHandle);
		this.particleHandle = {
			...baseHandle,
			...customMethods,
		};
		return this.particleHandle as BehaviorHandle<
			ParticleEmitterBehaviorOptions,
			ParticleEmitterHandle
		> & ParticleEmitterHandle;
	}

	play(): void {
		this.resolveParticleHandle()?.play();
	}

	stop(): void {
		this.resolveParticleHandle()?.stop();
	}

	pause(): void {
		this.resolveParticleHandle()?.pause();
	}

	restart(): void {
		this.resolveParticleHandle()?.restart();
	}

	burst(): void {
		this.resolveParticleHandle()?.burst();
	}

	isPlaying(): boolean {
		return this.resolveParticleHandle()?.isPlaying() ?? false;
	}

	getSystem(): ParticleEmitterHandle['getSystem'] extends () => infer T ? T : null {
		return this.resolveParticleHandle()?.getSystem() as any;
	}

	override buildInfo(): Record<string, string> {
		return {
			...super.buildInfo(),
			type: String(ZylemParticleSystem.type),
		};
	}
}

function createParticleSystemInternal(
	options?: Partial<ZylemParticleSystemOptions>,
	initializeBehavior = true,
): ZylemParticleSystem {
	const entity = new ZylemParticleSystem(options, initializeBehavior);
	return finalizeEntityCloneSupport(entity, (cloneOptions) =>
		createParticleSystemInternal(
			cloneOptions as Partial<ZylemParticleSystemOptions> | undefined,
			false,
		),
	);
}

export function createParticleSystem(
	options?: Partial<ZylemParticleSystemOptions>,
): ZylemParticleSystem {
	return createParticleSystemInternal(options, true);
}
