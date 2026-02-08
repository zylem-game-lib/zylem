/**
 * Ricochet2DFSM
 *
 * FSM + extended state to track ricochet events and results.
 * The FSM state tracks whether a ricochet is currently occurring.
 */
import { BaseEntityInterface } from "../../types/entity-types";
import { StateMachine, t } from 'typescript-fsm';

export interface Ricochet2DResult {
	/** The reflected velocity vector */
	velocity: { x: number; y: number; z?: number };
	/** The resulting speed after reflection */
	speed: number;
	/** The collision normal used for reflection */
	normal: { x: number; y: number; z?: number };
}

export interface Ricochet2DCollisionContext {
	entity?: BaseEntityInterface;
	otherEntity?: BaseEntityInterface;
	/** Current velocity of the entity (optional if entity is provided) */
	selfVelocity?: { x: number; y: number; z?: number };
	/** Contact information from the collision */
	contact: {
		/** The collision normal */
		normal?: { x: number; y: number; z?: number };
		/**
		 * Optional position where the collision occurred.
		 * If provided, used for precise offset calculation.
		 */
		position?: { x: number; y: number; z?: number };
	};
	/**
	 * Optional position of the entity that owns this behavior.
	 * Used with contact.position for offset calculations.
	 */
	selfPosition?: { x: number; y: number; z?: number };
	/**
	 * Optional position of the other entity in the collision.
	 * Used for paddle-style deflection: offset = (contactY - otherY) / halfHeight.
	 */
	otherPosition?: { x: number; y: number; z?: number };
	/**
	 * Optional size of the other entity (e.g., paddle size).
	 * If provided, used to normalize the offset based on the collision face.
	 */
	otherSize?: { x: number; y: number; z?: number };
}

export enum Ricochet2DState {
	Idle = 'idle',
	Ricocheting = 'ricocheting',
}

export enum Ricochet2DEvent {
	StartRicochet = 'start-ricochet',
	EndRicochet = 'end-ricochet',
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

/**
 * Callback type for ricochet event listeners.
 */
export type RicochetCallback = (result: Ricochet2DResult) => void;

/**
 * FSM wrapper with extended state (lastResult).
 * Systems or consumers call `computeRicochet(...)` when a collision occurs.
 */
export class Ricochet2DFSM {
	public readonly machine: StateMachine<Ricochet2DState, Ricochet2DEvent, never>;

	private lastResult: Ricochet2DResult | null = null;
	private lastUpdatedAtMs: number | null = null;
	private currentTimeMs: number = 0;
	private listeners: Set<RicochetCallback> = new Set();

	constructor() {
		this.machine = new StateMachine<Ricochet2DState, Ricochet2DEvent, never>(
			Ricochet2DState.Idle,
			[
				t(Ricochet2DState.Idle, Ricochet2DEvent.StartRicochet, Ricochet2DState.Ricocheting),
				t(Ricochet2DState.Ricocheting, Ricochet2DEvent.EndRicochet, Ricochet2DState.Idle),

				// Self transitions (no-ops)
				t(Ricochet2DState.Idle, Ricochet2DEvent.EndRicochet, Ricochet2DState.Idle),
				t(Ricochet2DState.Ricocheting, Ricochet2DEvent.StartRicochet, Ricochet2DState.Ricocheting),
			]
		);
	}

	/**
	 * Add a listener for ricochet events.
	 * @returns Unsubscribe function
	 */
	addListener(callback: RicochetCallback): () => void {
		this.listeners.add(callback);
		return () => this.listeners.delete(callback);
	}

	/**
	 * Emit result to all listeners.
	 */
	private emitToListeners(result: Ricochet2DResult): void {
		for (const callback of this.listeners) {
			try {
				callback(result);
			} catch (e) {
				console.error('[Ricochet2DFSM] Listener error:', e);
			}
		}
	}

	getState(): Ricochet2DState {
		return this.machine.getState();
	}

	/**
	 * Returns the last computed ricochet result, or null if none.
	 */
	getLastResult(): Ricochet2DResult | null {
		return this.lastResult;
	}

	/**
	 * Best-effort timestamp (ms) of the last computation.
	 */
	getLastUpdatedAtMs(): number | null {
		return this.lastUpdatedAtMs;
	}

	/**
	 * Set current game time (called by system each frame).
	 * Used for cooldown calculations.
	 */
	setCurrentTimeMs(timeMs: number): void {
		this.currentTimeMs = timeMs;
	}

	/**
	 * Check if ricochet is on cooldown (to prevent rapid duplicate applications).
	 * @param cooldownMs Cooldown duration in milliseconds (default: 50ms)
	 */
	isOnCooldown(cooldownMs: number = 50): boolean {
		if (this.lastUpdatedAtMs === null) return false;
		return (this.currentTimeMs - this.lastUpdatedAtMs) < cooldownMs;
	}

	/**
	 * Reset cooldown state (e.g., on entity respawn).
	 */
	resetCooldown(): void {
		this.lastUpdatedAtMs = null;
	}

	/**
	 * Compute a ricochet result from collision context.
	 * Returns the result for the consumer to apply, or null if invalid input.
	 */
	computeRicochet(
		ctx: Ricochet2DCollisionContext,
		options: {
			minSpeed?: number;
			maxSpeed?: number;
			speedMultiplier?: number;
			reflectionMode?: 'simple' | 'angled';
			maxAngleDeg?: number;
		} = {}
	): Ricochet2DResult | null {
		const {
			minSpeed = 2,
			maxSpeed = 20,
			speedMultiplier = 1.05,
			reflectionMode = 'angled',
			maxAngleDeg = 60,
		} = options;

		// Extract data from entities if provided
		const { selfVelocity, selfPosition, otherPosition, otherSize } = this.extractDataFromEntities(ctx);

		if (!selfVelocity) {
			this.dispatch(Ricochet2DEvent.EndRicochet);
			return null;
		}

		const speed = Math.hypot(selfVelocity.x, selfVelocity.y);
		if (speed === 0) {
			this.dispatch(Ricochet2DEvent.EndRicochet);
			return null;
		}

		// Compute or extract collision normal
		const normal = ctx.contact.normal ?? this.computeNormalFromPositions(selfPosition, otherPosition);
		if (!normal) {
			this.dispatch(Ricochet2DEvent.EndRicochet);
			return null;
		}

		// Compute basic reflection
		let reflected = this.computeBasicReflection(selfVelocity, normal);

		// Apply angled deflection if requested
		if (reflectionMode === 'angled') {
			reflected = this.computeAngledDeflection(
				selfVelocity,
				normal,
				speed,
				maxAngleDeg,
				speedMultiplier,
				selfPosition,
				otherPosition,
				otherSize,
				ctx.contact.position
			);
		}

		// Apply final speed constraints
		reflected = this.applySpeedClamp(reflected, minSpeed, maxSpeed);

		const result: Ricochet2DResult = {
			velocity: { x: reflected.x, y: reflected.y, z: 0 },
			speed: Math.hypot(reflected.x, reflected.y),
			normal: { x: normal.x, y: normal.y, z: 0 },
		};

		this.lastResult = result;
		this.lastUpdatedAtMs = this.currentTimeMs;
		this.dispatch(Ricochet2DEvent.StartRicochet);
		this.emitToListeners(result);

		return result;
	}

	/**
	 * Extract velocity, position, and size data from entities or context.
	 */
	private extractDataFromEntities(ctx: Ricochet2DCollisionContext) {
		let selfVelocity = ctx.selfVelocity;
		let selfPosition = ctx.selfPosition;
		let otherPosition = ctx.otherPosition;
		let otherSize = ctx.otherSize;

		if (ctx.entity?.body) {
			const vel = ctx.entity.body.linvel();
			selfVelocity = selfVelocity ?? { x: vel.x, y: vel.y, z: vel.z };
			const pos = ctx.entity.body.translation();
			selfPosition = selfPosition ?? { x: pos.x, y: pos.y, z: pos.z };
		}

		if (ctx.otherEntity?.body) {
			const pos = ctx.otherEntity.body.translation();
			otherPosition = otherPosition ?? { x: pos.x, y: pos.y, z: pos.z };
		}

		if (ctx.otherEntity && 'size' in ctx.otherEntity) {
			const size = (ctx.otherEntity as any).size;
			if (size && typeof size.x === 'number') {
				otherSize = otherSize ?? { x: size.x, y: size.y, z: size.z };
			}
		}

		return { selfVelocity, selfPosition, otherPosition, otherSize };
	}

	/**
	 * Compute collision normal from entity positions using AABB heuristic.
	 */
	private computeNormalFromPositions(
		selfPosition?: { x: number; y: number; z?: number },
		otherPosition?: { x: number; y: number; z?: number }
	): { x: number; y: number; z?: number } | null {
		if (!selfPosition || !otherPosition) return null;

		const dx = selfPosition.x - otherPosition.x;
		const dy = selfPosition.y - otherPosition.y;

		// Simple "which face was hit" logic for box collisions
		if (Math.abs(dx) > Math.abs(dy)) {
			return { x: dx > 0 ? 1 : -1, y: 0, z: 0 };
		} else {
			return { x: 0, y: dy > 0 ? 1 : -1, z: 0 };
		}
	}

	/**
	 * Compute basic reflection using the formula: v' = v - 2(v·n)n
	 */
	private computeBasicReflection(
		velocity: { x: number; y: number },
		normal: { x: number; y: number; z?: number }
	): { x: number; y: number } {
		const vx = velocity.x;
		const vy = velocity.y;
		const dotProduct = vx * normal.x + vy * normal.y;

		return {
			x: vx - 2 * dotProduct * normal.x,
			y: vy - 2 * dotProduct * normal.y,
		};
	}

	/**
	 * Compute angled deflection for paddle-style reflections.
	 */
	private computeAngledDeflection(
		velocity: { x: number; y: number },
		normal: { x: number; y: number; z?: number },
		speed: number,
		maxAngleDeg: number,
		speedMultiplier: number,
		selfPosition?: { x: number; y: number; z?: number },
		otherPosition?: { x: number; y: number; z?: number },
		otherSize?: { x: number; y: number; z?: number },
		contactPosition?: { x: number; y: number; z?: number }
	): { x: number; y: number } {
		const maxAngleRad = (maxAngleDeg * Math.PI) / 180;

		// Tangent vector (perpendicular to normal)
		let tx = -normal.y;
		let ty = normal.x;

		// Ensure tangent points in positive direction of the deflection axis
		// so that positive offset (right/top) results in positive deflection
		if (Math.abs(normal.x) > Math.abs(normal.y)) {
			// Vertical face (Normal is X-aligned). Deflection axis is Y.
			// We want ty > 0.
			if (ty < 0) {
				tx = -tx;
				ty = -ty;
			}
		} else {
			// Horizontal face (Normal is Y-aligned). Deflection axis is X.
			// We want tx > 0.
			if (tx < 0) {
				tx = -tx;
				ty = -ty;
			}
		}

		// Compute offset based on hit position
		const offset = this.computeHitOffset(
			velocity,
			normal,
			speed,
			tx,
			ty,
			selfPosition,
			otherPosition,
			otherSize,
			contactPosition
		);

		const angle = clamp(offset, -1, 1) * maxAngleRad;

		const cosA = Math.cos(angle);
		const sinA = Math.sin(angle);

		const newSpeed = speed * speedMultiplier;

		return {
			x: newSpeed * (normal.x * cosA + tx * sinA),
			y: newSpeed * (normal.y * cosA + ty * sinA),
		};
	}

	/**
	 * Compute hit offset for angled deflection (-1 to 1).
	 */
	private computeHitOffset(
		velocity: { x: number; y: number },
		normal: { x: number; y: number; z?: number },
		speed: number,
		tx: number,
		ty: number,
		selfPosition?: { x: number; y: number; z?: number },
		otherPosition?: { x: number; y: number; z?: number },
		otherSize?: { x: number; y: number; z?: number },
		contactPosition?: { x: number; y: number; z?: number }
	): number {
		// Use position-based offset if available
		if (otherPosition && otherSize) {
			const useY = Math.abs(normal.x) > Math.abs(normal.y);
			const halfExtent = useY ? otherSize.y / 2 : otherSize.x / 2;

			if (useY) {
				const selfY = selfPosition?.y ?? contactPosition?.y ?? 0;
				const paddleY = otherPosition.y;
				return (selfY - paddleY) / halfExtent;
			} else {
				const selfX = selfPosition?.x ?? contactPosition?.x ?? 0;
				const paddleX = otherPosition.x;
				return (selfX - paddleX) / halfExtent;
			}
		}

		// Fallback: use velocity-based offset
		return (velocity.x * tx + velocity.y * ty) / speed;
	}

	/**
	 * Apply speed constraints to the reflected velocity.
	 */
	private applySpeedClamp(
		velocity: { x: number; y: number },
		minSpeed: number,
		maxSpeed: number
	): { x: number; y: number } {
		const currentSpeed = Math.hypot(velocity.x, velocity.y);
		if (currentSpeed === 0) return velocity;

		const targetSpeed = clamp(currentSpeed, minSpeed, maxSpeed);
		const scale = targetSpeed / currentSpeed;

		return {
			x: velocity.x * scale,
			y: velocity.y * scale,
		};
	}

	/**
	 * Clear the ricochet state (call after consumer has applied the result).
	 */
	clearRicochet(): void {
		this.dispatch(Ricochet2DEvent.EndRicochet);
	}

	private dispatch(event: Ricochet2DEvent): void {
		if (this.machine.can(event)) {
			this.machine.dispatch(event);
		}
	}
}
