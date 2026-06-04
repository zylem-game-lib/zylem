import { SyncStateMachine, t } from '../../core/utility/sync-state-machine';
import { BaseEntityInterface } from '../../types/entity-types';

export interface Ricochet3DResult {
	velocity: { x: number; y: number; z: number };
	speed: number;
	normal: { x: number; y: number; z: number };
}

export interface Ricochet3DCollisionContext {
	entity?: BaseEntityInterface;
	otherEntity?: BaseEntityInterface;
	selfVelocity?: { x: number; y: number; z: number };
	contact: {
		normal?: { x: number; y: number; z: number };
		position?: { x: number; y: number; z: number };
	};
	selfPosition?: { x: number; y: number; z: number };
	otherPosition?: { x: number; y: number; z: number };
	otherSize?: { x: number; y: number; z: number };
}

export enum Ricochet3DState {
	Idle = 'idle',
	Ricocheting = 'ricocheting',
}

export enum Ricochet3DEvent {
	StartRicochet = 'start-ricochet',
	EndRicochet = 'end-ricochet',
}

export type Ricochet3DCallback = (result: Ricochet3DResult) => void;

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function length3(x: number, y: number, z: number): number {
	return Math.sqrt(x * x + y * y + z * z);
}

export class Ricochet3DFSM {
	public readonly machine: SyncStateMachine<Ricochet3DState, Ricochet3DEvent, never>;

	private lastResult: Ricochet3DResult | null = null;
	private lastUpdatedAtMs: number | null = null;
	private currentTimeMs = 0;
	private listeners = new Set<Ricochet3DCallback>();

	constructor() {
		this.machine = new SyncStateMachine<Ricochet3DState, Ricochet3DEvent, never>(
			Ricochet3DState.Idle,
			[
				t(Ricochet3DState.Idle, Ricochet3DEvent.StartRicochet, Ricochet3DState.Ricocheting),
				t(Ricochet3DState.Ricocheting, Ricochet3DEvent.EndRicochet, Ricochet3DState.Idle),
				t(Ricochet3DState.Idle, Ricochet3DEvent.EndRicochet, Ricochet3DState.Idle),
				t(Ricochet3DState.Ricocheting, Ricochet3DEvent.StartRicochet, Ricochet3DState.Ricocheting),
			],
		);
	}

	addListener(callback: Ricochet3DCallback): () => void {
		this.listeners.add(callback);
		return () => this.listeners.delete(callback);
	}

	getState(): Ricochet3DState {
		return this.machine.getState();
	}

	getLastResult(): Ricochet3DResult | null {
		return this.lastResult;
	}

	getLastUpdatedAtMs(): number | null {
		return this.lastUpdatedAtMs;
	}

	setCurrentTimeMs(timeMs: number): void {
		this.currentTimeMs = timeMs;
	}

	isOnCooldown(cooldownMs: number = 50): boolean {
		if (this.lastUpdatedAtMs === null) return false;
		return (this.currentTimeMs - this.lastUpdatedAtMs) < cooldownMs;
	}

	resetCooldown(): void {
		this.lastUpdatedAtMs = null;
	}

	computeRicochet(
		ctx: Ricochet3DCollisionContext,
		options: {
			minSpeed?: number;
			maxSpeed?: number;
			speedMultiplier?: number;
			reflectionMode?: 'simple' | 'angled';
			maxAngleDeg?: number;
		} = {},
	): Ricochet3DResult | null {
		const {
			minSpeed = 2,
			maxSpeed = 20,
			speedMultiplier = 1.05,
			reflectionMode = 'angled',
			maxAngleDeg = 45,
		} = options;

		const {
			selfVelocity,
			selfPosition,
			otherPosition,
			otherSize,
		} = this.extractDataFromEntities(ctx);

		if (!selfVelocity) {
			this.dispatch(Ricochet3DEvent.EndRicochet);
			return null;
		}

		const speed = length3(selfVelocity.x, selfVelocity.y, selfVelocity.z);
		if (speed === 0) {
			this.dispatch(Ricochet3DEvent.EndRicochet);
			return null;
		}

		const normal = ctx.contact.normal ?? this.computeNormalFromPositions(selfPosition, otherPosition);
		if (!normal) {
			this.dispatch(Ricochet3DEvent.EndRicochet);
			return null;
		}

		const unitNormal = this.normalizeVector(normal);
		let reflected = this.computeBasicReflection(selfVelocity, unitNormal);

		if (reflectionMode === 'angled') {
			reflected = this.computeAngledDeflection(
				reflected,
				selfVelocity,
				unitNormal,
				speed,
				maxAngleDeg,
				speedMultiplier,
				selfPosition,
				otherPosition,
				otherSize,
				ctx.contact.position,
			);
		} else {
			reflected = {
				x: reflected.x * speedMultiplier,
				y: reflected.y * speedMultiplier,
				z: reflected.z * speedMultiplier,
			};
		}

		reflected = this.applySpeedClamp(reflected, minSpeed, maxSpeed);

		const result: Ricochet3DResult = {
			velocity: reflected,
			speed: length3(reflected.x, reflected.y, reflected.z),
			normal: unitNormal,
		};

		this.lastResult = result;
		this.lastUpdatedAtMs = this.currentTimeMs;
		this.dispatch(Ricochet3DEvent.StartRicochet);
		this.emitToListeners(result);
		return result;
	}

	clearRicochet(): void {
		this.dispatch(Ricochet3DEvent.EndRicochet);
	}

	private emitToListeners(result: Ricochet3DResult): void {
		for (const callback of this.listeners) {
			try {
				callback(result);
			} catch (error) {
				console.error('[Ricochet3DFSM] Listener error:', error);
			}
		}
	}

	private extractDataFromEntities(ctx: Ricochet3DCollisionContext) {
		let selfVelocity = ctx.selfVelocity;
		let selfPosition = ctx.selfPosition;
		let otherPosition = ctx.otherPosition;
		let otherSize = ctx.otherSize;

		if (ctx.entity?.body) {
			const velocity = ctx.entity.body.linvel();
			selfVelocity = selfVelocity ?? { x: velocity.x, y: velocity.y, z: velocity.z };
			const position = ctx.entity.body.translation();
			selfPosition = selfPosition ?? { x: position.x, y: position.y, z: position.z };
		}

		if (ctx.otherEntity?.body) {
			const position = ctx.otherEntity.body.translation();
			otherPosition = otherPosition ?? { x: position.x, y: position.y, z: position.z };
		}

		if (ctx.otherEntity && 'size' in ctx.otherEntity) {
			const size = (ctx.otherEntity as any).size;
			if (size && typeof size.x === 'number') {
				otherSize = otherSize ?? { x: size.x, y: size.y, z: size.z };
			}
		}

		return { selfVelocity, selfPosition, otherPosition, otherSize };
	}

	private computeNormalFromPositions(
		selfPosition?: { x: number; y: number; z: number },
		otherPosition?: { x: number; y: number; z: number },
	): { x: number; y: number; z: number } | null {
		if (!selfPosition || !otherPosition) return null;

		const delta = {
			x: selfPosition.x - otherPosition.x,
			y: selfPosition.y - otherPosition.y,
			z: selfPosition.z - otherPosition.z,
		};
		const absX = Math.abs(delta.x);
		const absY = Math.abs(delta.y);
		const absZ = Math.abs(delta.z);

		if (absX >= absY && absX >= absZ) {
			return { x: delta.x >= 0 ? 1 : -1, y: 0, z: 0 };
		}
		if (absY >= absX && absY >= absZ) {
			return { x: 0, y: delta.y >= 0 ? 1 : -1, z: 0 };
		}
		return { x: 0, y: 0, z: delta.z >= 0 ? 1 : -1 };
	}

	private normalizeVector(vector: { x: number; y: number; z: number }) {
		const magnitude = length3(vector.x, vector.y, vector.z);
		if (magnitude <= 1e-6) {
			return { x: 0, y: 1, z: 0 };
		}
		return {
			x: vector.x / magnitude,
			y: vector.y / magnitude,
			z: vector.z / magnitude,
		};
	}

	private dot(
		a: { x: number; y: number; z: number },
		b: { x: number; y: number; z: number },
	): number {
		return a.x * b.x + a.y * b.y + a.z * b.z;
	}

	private computeBasicReflection(
		velocity: { x: number; y: number; z: number },
		normal: { x: number; y: number; z: number },
	): { x: number; y: number; z: number } {
		const dotProduct = this.dot(velocity, normal);
		return {
			x: velocity.x - 2 * dotProduct * normal.x,
			y: velocity.y - 2 * dotProduct * normal.y,
			z: velocity.z - 2 * dotProduct * normal.z,
		};
	}

	private computeAngledDeflection(
		reflected: { x: number; y: number; z: number },
		incoming: { x: number; y: number; z: number },
		normal: { x: number; y: number; z: number },
		speed: number,
		maxAngleDeg: number,
		speedMultiplier: number,
		selfPosition?: { x: number; y: number; z: number },
		otherPosition?: { x: number; y: number; z: number },
		otherSize?: { x: number; y: number; z: number },
		contactPosition?: { x: number; y: number; z: number },
	): { x: number; y: number; z: number } {
		const baseDirection = this.normalizeVector(reflected);
		const tangentVector = this.computeHitOffsetVector(
			incoming,
			normal,
			selfPosition,
			otherPosition,
			otherSize,
			contactPosition,
		);

		const offsetStrength = clamp(
			length3(tangentVector.x, tangentVector.y, tangentVector.z),
			0,
			1,
		);
		if (offsetStrength === 0) {
			return {
				x: baseDirection.x * speed * speedMultiplier,
				y: baseDirection.y * speed * speedMultiplier,
				z: baseDirection.z * speed * speedMultiplier,
			};
		}

		const tangentDirection = this.normalizeVector(tangentVector);
		const angle = offsetStrength * (maxAngleDeg * Math.PI / 180);
		const cosAngle = Math.cos(angle);
		const sinAngle = Math.sin(angle);
		const direction = this.normalizeVector({
			x: baseDirection.x * cosAngle + tangentDirection.x * sinAngle,
			y: baseDirection.y * cosAngle + tangentDirection.y * sinAngle,
			z: baseDirection.z * cosAngle + tangentDirection.z * sinAngle,
		});
		const newSpeed = speed * speedMultiplier;

		return {
			x: direction.x * newSpeed,
			y: direction.y * newSpeed,
			z: direction.z * newSpeed,
		};
	}

	private computeHitOffsetVector(
		velocity: { x: number; y: number; z: number },
		normal: { x: number; y: number; z: number },
		selfPosition?: { x: number; y: number; z: number },
		otherPosition?: { x: number; y: number; z: number },
		otherSize?: { x: number; y: number; z: number },
		contactPosition?: { x: number; y: number; z: number },
	): { x: number; y: number; z: number } {
		if (otherPosition && otherSize) {
			const faceAxis = this.getDominantAxis(normal);
			if (faceAxis === 'x') {
				return {
					x: 0,
					y: ((selfPosition?.y ?? contactPosition?.y ?? otherPosition.y) - otherPosition.y) / Math.max(otherSize.y / 2, 1e-6),
					z: ((selfPosition?.z ?? contactPosition?.z ?? otherPosition.z) - otherPosition.z) / Math.max(otherSize.z / 2, 1e-6),
				};
			}
			if (faceAxis === 'y') {
				return {
					x: ((selfPosition?.x ?? contactPosition?.x ?? otherPosition.x) - otherPosition.x) / Math.max(otherSize.x / 2, 1e-6),
					y: 0,
					z: ((selfPosition?.z ?? contactPosition?.z ?? otherPosition.z) - otherPosition.z) / Math.max(otherSize.z / 2, 1e-6),
				};
			}
			return {
				x: ((selfPosition?.x ?? contactPosition?.x ?? otherPosition.x) - otherPosition.x) / Math.max(otherSize.x / 2, 1e-6),
				y: ((selfPosition?.y ?? contactPosition?.y ?? otherPosition.y) - otherPosition.y) / Math.max(otherSize.y / 2, 1e-6),
				z: 0,
			};
		}

		const tangent = {
			x: velocity.x - this.dot(velocity, normal) * normal.x,
			y: velocity.y - this.dot(velocity, normal) * normal.y,
			z: velocity.z - this.dot(velocity, normal) * normal.z,
		};
		const tangentLength = length3(tangent.x, tangent.y, tangent.z);
		if (tangentLength <= 1e-6) {
			return { x: 0, y: 0, z: 0 };
		}
		return {
			x: tangent.x / tangentLength,
			y: tangent.y / tangentLength,
			z: tangent.z / tangentLength,
		};
	}

	private getDominantAxis(vector: { x: number; y: number; z: number }): 'x' | 'y' | 'z' {
		const absX = Math.abs(vector.x);
		const absY = Math.abs(vector.y);
		const absZ = Math.abs(vector.z);
		if (absX >= absY && absX >= absZ) return 'x';
		if (absY >= absX && absY >= absZ) return 'y';
		return 'z';
	}

	private applySpeedClamp(
		velocity: { x: number; y: number; z: number },
		minSpeed: number,
		maxSpeed: number,
	): { x: number; y: number; z: number } {
		const currentSpeed = length3(velocity.x, velocity.y, velocity.z);
		if (currentSpeed === 0) return velocity;

		const targetSpeed = clamp(currentSpeed, minSpeed, maxSpeed);
		const scale = targetSpeed / currentSpeed;
		return {
			x: velocity.x * scale,
			y: velocity.y * scale,
			z: velocity.z * scale,
		};
	}

	private dispatch(event: Ricochet3DEvent): void {
		if (this.machine.can(event)) {
			this.machine.syncDispatch(event);
		}
	}
}
