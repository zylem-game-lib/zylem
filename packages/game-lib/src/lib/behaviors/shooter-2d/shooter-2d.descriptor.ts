import type { IWorld } from 'bitecs';
import { defineBehavior, type BehaviorRef } from '../behavior-descriptor';
import type { BehaviorEntityLink, BehaviorSystem } from '../behavior-system';
import {
	angleFromDirection2D,
	directionFromAngle2D,
	getRotationAngle2D,
	normalizeDirection2D,
	rotateLocalOffset2D,
} from '../shared/direction-2d';
import {
	createShooter2DStateComponent,
	type Shooter2DStateComponent,
} from './components';

export interface Shooter2DTarget {
	x: number;
	y: number;
}

export interface Shooter2DStageLike {
	add(...inputs: any[]): void;
}

export interface Shooter2DProjectileEntity {
	transformStore: {
		velocity: { x: number; y: number; z: number };
		dirty: { velocity: boolean };
	};
	prependSetup(
		callback: (params: { me: Shooter2DProjectileEntity }) => void,
	): unknown;
	setPosition(x: number, y: number, z: number): void;
	setRotationZ(angle: number): void;
}

export type Shooter2DProjectileFactory = () =>
	| Shooter2DProjectileEntity
	| Promise<Shooter2DProjectileEntity>;

export interface Shooter2DBehaviorOptions {
	projectileFactory: Shooter2DProjectileFactory;
	projectileSpeed: number;
	cooldownMs?: number;
	spawnOffset?: Shooter2DTarget;
	rotateProjectile?: boolean;
}

export interface Shooter2DSourceEntity {
	body?: {
		translation(): { x: number; y: number; z: number };
		rotation?: () => { x: number; y: number; z: number; w: number };
	} | null;
	options?: {
		position?: { x: number; y: number; z?: number };
	};
	topDownMovementState?: {
		facingAngle: number;
	};
	shooter2dState?: Shooter2DStateComponent;
	_rotation2DAngle?: number;
}

export interface Shooter2DFireArgs {
	source: Shooter2DSourceEntity;
	stage: Shooter2DStageLike;
	target: Shooter2DTarget;
}

export interface Shooter2DHandle {
	isReady(source: Shooter2DSourceEntity): boolean;
	fire(args: Shooter2DFireArgs): Promise<Shooter2DProjectileEntity | null>;
}

const defaultOptions: Shooter2DBehaviorOptions = {
	projectileFactory: () => {
		throw new Error('Shooter2DBehavior requires a projectileFactory.');
	},
	projectileSpeed: 12,
	cooldownMs: 0,
	spawnOffset: { x: 0, y: 1 },
	rotateProjectile: true,
};

const SHOOTER_2D_BEHAVIOR_KEY = Symbol.for('zylem:behavior:shooter-2d');

function ensureShooterState(entity: Shooter2DSourceEntity): Shooter2DStateComponent {
	if (!entity.shooter2dState) {
		entity.shooter2dState = createShooter2DStateComponent();
	}
	return entity.shooter2dState;
}

function getEntityPosition(
	entity: Shooter2DSourceEntity,
): { x: number; y: number; z: number } | null {
	if (entity.body?.translation) {
		return entity.body.translation();
	}

	const position = entity.options?.position;
	if (!position) {
		return null;
	}

	return {
		x: position.x,
		y: position.y,
		z: position.z ?? 0,
	};
}

function getEntityFacingAngle(entity: Shooter2DSourceEntity): number {
	if (entity.topDownMovementState) {
		return entity.topDownMovementState.facingAngle;
	}

	if (entity.body?.rotation) {
		return getRotationAngle2D(entity.body.rotation());
	}

	return entity._rotation2DAngle ?? 0;
}

function createShooter2DHandle(
	ref: BehaviorRef<Shooter2DBehaviorOptions>,
): Shooter2DHandle {
	return {
		isReady: (source: Shooter2DSourceEntity) =>
			ensureShooterState(source).cooldownRemainingMs <= 0,
		fire: async ({
			source,
			stage,
			target,
		}: Shooter2DFireArgs): Promise<Shooter2DProjectileEntity | null> => {
			const state = ensureShooterState(source);
			if (state.cooldownRemainingMs > 0) {
				return null;
			}

			const sourcePosition = getEntityPosition(source);
			if (!sourcePosition) {
				return null;
			}

			const options = ref.options;
			const aimDirection = normalizeDirection2D(
				target.x - sourcePosition.x,
				target.y - sourcePosition.y,
			);
			const angle = aimDirection
				? angleFromDirection2D(aimDirection)
				: getEntityFacingAngle(source);
			const direction = aimDirection ?? directionFromAngle2D(angle);
			const offset = rotateLocalOffset2D(
				options.spawnOffset ?? defaultOptions.spawnOffset!,
				angle,
			);
			const spawnPosition = {
				x: sourcePosition.x + offset.x,
				y: sourcePosition.y + offset.y,
				z: sourcePosition.z,
			};
			const projectile = await Promise.resolve(options.projectileFactory());
			projectile.prependSetup(({ me }) => {
				me.setPosition(spawnPosition.x, spawnPosition.y, spawnPosition.z);
				if (options.rotateProjectile ?? true) {
					me.setRotationZ(angle);
				}
				me.transformStore.velocity.x = direction.x * options.projectileSpeed;
				me.transformStore.velocity.y = direction.y * options.projectileSpeed;
				me.transformStore.velocity.z = 0;
				me.transformStore.dirty.velocity = true;
			});

			stage.add(projectile);
			state.cooldownRemainingMs = Math.max(0, options.cooldownMs ?? 0);
			return projectile;
		},
	};
}

class Shooter2DBehaviorSystem implements BehaviorSystem {
	constructor(
		private getBehaviorLinks?: (key: symbol) => Iterable<BehaviorEntityLink>,
	) {}

	update(_ecs: IWorld, delta: number): void {
		const links = this.getBehaviorLinks?.(SHOOTER_2D_BEHAVIOR_KEY);
		if (!links) return;

		for (const link of links) {
			const entity = link.entity as Shooter2DSourceEntity;
			const ref = link.ref as any;
			const state = ensureShooterState(entity);
			state.cooldownRemainingMs = Math.max(
				0,
				state.cooldownRemainingMs - delta * 1000,
			);
			ref.__entity = entity;
		}
	}

	destroy(_ecs: IWorld): void {}
}

export const Shooter2DBehavior = defineBehavior<
	Shooter2DBehaviorOptions,
	Shooter2DHandle,
	Shooter2DSourceEntity
>({
	name: 'shooter-2d',
	defaultOptions,
	systemFactory: (ctx) => new Shooter2DBehaviorSystem(ctx.getBehaviorLinks),
	createHandle: createShooter2DHandle,
});
