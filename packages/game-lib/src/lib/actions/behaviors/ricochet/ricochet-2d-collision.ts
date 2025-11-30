import { CollisionContext, GameEntity } from '../../../entities/entity';
import { MoveableEntity } from '../../capabilities/moveable';
import { matchesCollisionSelector } from '../../../collision/utils';
import { Ricochet2DCollisionOptions, clamp, Ricochet2DCollisionCallback } from './ricochet';

/**
 * Behavior for ricocheting an entity off other objects in 2D
 */
export function ricochet2DCollision(
	options: Partial<Ricochet2DCollisionOptions> = {},
	callback?: Ricochet2DCollisionCallback
): { type: 'collision'; handler: (ctx: CollisionContext<MoveableEntity, GameEntity<any>>) => void } {
	return {
		type: 'collision',
		handler: (collisionContext: CollisionContext<MoveableEntity, GameEntity<any>>) => {
			debugger;
			_handleRicochet2DCollision(collisionContext, options, callback);
		},
	};
}

function _handleRicochet2DCollision(
	collisionContext: CollisionContext<MoveableEntity, GameEntity<any>>,
	options: Partial<Ricochet2DCollisionOptions>,
	callback?: Ricochet2DCollisionCallback
) {
	const { entity, other } = collisionContext;
	const self = entity as unknown as GameEntity<any> & MoveableEntity;
	if (other.collider?.isSensor()) return;

	const {
		minSpeed = 2,
		maxSpeed = 20,
		separation = 0,
		collisionWith = undefined,
	} = {
		...options,
	} as Ricochet2DCollisionOptions;
	const reflectionMode: 'simple' | 'angled' = (options as any)?.reflectionMode ?? 'angled';
	const maxAngleDeg = (options as any)?.maxAngleDeg ?? 60;
	const speedUpFactor = (options as any)?.speedUpFactor ?? 1.05;
	const minOffsetForAngle = (options as any)?.minOffsetForAngle ?? 0.15; // 0..1
	const centerRetentionFactor = (options as any)?.centerRetentionFactor ?? 0.5; // keep some Y on center hits

	if (!matchesCollisionSelector(other, collisionWith)) return;

	const selfPos = self.getPosition();
	const otherPos = other.body?.translation();
	const vel = self.getVelocity();
	if (!selfPos || !otherPos || !vel) return;

	let newVelX = vel.x;
	let newVelY = vel.y;
	let newX = selfPos.x;
	let newY = selfPos.y;

	const dx = selfPos.x - otherPos.x;
	const dy = selfPos.y - otherPos.y;

	let extentX: number | null = null;
	let extentY: number | null = null;
	const colliderShape: any = other.collider?.shape as any;
	if (colliderShape) {
		if (colliderShape.halfExtents) {
			extentX = Math.abs(colliderShape.halfExtents.x ?? colliderShape.halfExtents[0] ?? null);
			extentY = Math.abs(colliderShape.halfExtents.y ?? colliderShape.halfExtents[1] ?? null);
		}
		if ((extentX == null || extentY == null) && (typeof colliderShape.radius === 'number')) {
			extentX = extentX ?? Math.abs(colliderShape.radius);
			extentY = extentY ?? Math.abs(colliderShape.radius);
		}
	}
	if ((extentX == null || extentY == null) && typeof (other.collider as any)?.halfExtents === 'function') {
		const he = (other.collider as any).halfExtents();
		if (he) {
			extentX = extentX ?? Math.abs(he.x);
			extentY = extentY ?? Math.abs(he.y);
		}
	}
	if ((extentX == null || extentY == null) && typeof (other.collider as any)?.radius === 'function') {
		const r = (other.collider as any).radius();
		if (typeof r === 'number') {
			extentX = extentX ?? Math.abs(r);
			extentY = extentY ?? Math.abs(r);
		}
	}

	let relX = 0;
	let relY = 0;
	if (extentX && extentY) {
		relX = clamp(dx / extentX, -1, 1);
		relY = clamp(dy / extentY, -1, 1);
	} else {
		relX = Math.sign(dx);
		relY = Math.sign(dy);
	}
	let bounceVertical = Math.abs(dy) >= Math.abs(dx);

	let selfExtentX: number | null = null;
	let selfExtentY: number | null = null;
	const selfShape: any = self.collider?.shape as any;
	if (selfShape) {
		if (selfShape.halfExtents) {
			selfExtentX = Math.abs(selfShape.halfExtents.x ?? selfShape.halfExtents[0] ?? null);
			selfExtentY = Math.abs(selfShape.halfExtents.y ?? selfShape.halfExtents[1] ?? null);
		}
		if ((selfExtentX == null || selfExtentY == null) && (typeof selfShape.radius === 'number')) {
			selfExtentX = selfExtentX ?? Math.abs(selfShape.radius);
			selfExtentY = selfExtentY ?? Math.abs(selfShape.radius);
		}
	}
	if ((selfExtentX == null || selfExtentY == null) && typeof (self.collider as any)?.halfExtents === 'function') {
		const heS = (self.collider as any).halfExtents();
		if (heS) {
			selfExtentX = selfExtentX ?? Math.abs(heS.x);
			selfExtentY = selfExtentY ?? Math.abs(heS.y);
		}
	}
	if ((selfExtentX == null || selfExtentY == null) && typeof (self.collider as any)?.radius === 'function') {
		const rS = (self.collider as any).radius();
		if (typeof rS === 'number') {
			selfExtentX = selfExtentX ?? Math.abs(rS);
			selfExtentY = selfExtentY ?? Math.abs(rS);
		}
	}

	if (extentX != null && extentY != null && selfExtentX != null && selfExtentY != null) {
		const penX = (selfExtentX + extentX) - Math.abs(dx);
		const penY = (selfExtentY + extentY) - Math.abs(dy);
		if (!Number.isNaN(penX) && !Number.isNaN(penY)) {
			bounceVertical = penY <= penX;
		}
	}

	let usedAngleDeflection = false;
	if (bounceVertical) {
		const resolvedY = (extentY ?? 0) + (selfExtentY ?? 0) + separation;
		newY = otherPos.y + (dy > 0 ? resolvedY : -resolvedY);
		newX = selfPos.x;

		const isHorizontalPaddle = extentX != null && extentY != null && extentX > extentY;
		if (isHorizontalPaddle && reflectionMode === 'angled') {
			const maxAngleRad = (maxAngleDeg * Math.PI) / 180;
			const deadzone = Math.max(0, Math.min(1, minOffsetForAngle));
			const clampedOffsetX = clamp(relX, -1, 1);
			const absOff = Math.abs(clampedOffsetX);
			const baseSpeed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
			const speed = clamp(baseSpeed * speedUpFactor, minSpeed, maxSpeed);
			if (absOff > deadzone) {
				const t = (absOff - deadzone) / (1 - deadzone);
				const angle = Math.sign(clampedOffsetX) * (t * maxAngleRad);
				const cosA = Math.cos(angle);
				const sinA = Math.sin(angle);
				const vy = Math.abs(speed * cosA);
				const vx = speed * sinA;
				newVelY = dy > 0 ? vy : -vy;
				newVelX = vx;
			} else {
				const vx = vel.x * centerRetentionFactor;
				const vyMagSquared = Math.max(0, speed * speed - vx * vx);
				const vy = Math.sqrt(vyMagSquared);
				newVelY = dy > 0 ? vy : -vy;
				newVelX = vx;
			}
			usedAngleDeflection = true;
		} else {
			// Simple vertical reflection (or non-paddle surface)
			newVelY = dy > 0 ? Math.abs(vel.y) : -Math.abs(vel.y);
			if (reflectionMode === 'simple') usedAngleDeflection = true;
		}
	} else {
		const resolvedX = (extentX ?? 0) + (selfExtentX ?? 0) + separation;
		newX = otherPos.x + (dx > 0 ? resolvedX : -resolvedX);
		newY = selfPos.y;

		if (reflectionMode === 'angled') {
			const maxAngleRad = (maxAngleDeg * Math.PI) / 180;
			const deadzone = Math.max(0, Math.min(1, minOffsetForAngle));
			const clampedOffsetY = clamp(relY, -1, 1);
			const absOff = Math.abs(clampedOffsetY);
			const baseSpeed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
			const speed = clamp(baseSpeed * speedUpFactor, minSpeed, maxSpeed);
			if (absOff > deadzone) {
				const t = (absOff - deadzone) / (1 - deadzone);
				const angle = Math.sign(clampedOffsetY) * (t * maxAngleRad);
				const cosA = Math.cos(angle);
				const sinA = Math.sin(angle);
				const vx = Math.abs(speed * cosA);
				const vy = speed * sinA;
				newVelX = dx > 0 ? vx : -vx;
				newVelY = vy;
			} else {
				const vy = vel.y * centerRetentionFactor;
				const vxMagSquared = Math.max(0, speed * speed - vy * vy);
				const vx = Math.sqrt(vxMagSquared);
				newVelX = dx > 0 ? vx : -vx;
				newVelY = vy;
			}
			usedAngleDeflection = true;
		} else {
			newVelX = dx > 0 ? Math.abs(vel.x) : -Math.abs(vel.x);
			newVelY = vel.y;
			usedAngleDeflection = true;
		}
	}

	if (!usedAngleDeflection) {
		const additionBaseX = Math.abs(newVelX);
		const additionBaseY = Math.abs(newVelY);
		const addX = Math.sign(relX) * Math.abs(relX) * additionBaseX;
		const addY = Math.sign(relY) * Math.abs(relY) * additionBaseY;
		newVelX += addX;
		newVelY += addY;
	}
	const currentSpeed = Math.sqrt(newVelX * newVelX + newVelY * newVelY);
	if (currentSpeed > 0) {
		const targetSpeed = clamp(currentSpeed, minSpeed, maxSpeed);
		if (targetSpeed !== currentSpeed) {
			const scale = targetSpeed / currentSpeed;
			newVelX *= scale;
			newVelY *= scale;
		}
	}

	if (newX !== selfPos.x || newY !== selfPos.y) {
		self.setPosition(newX, newY, selfPos.z);
		self.moveXY(newVelX, newVelY);
		if (callback) {
			const velocityAfter = self.getVelocity();
			if (velocityAfter) {
				callback({
					position: { x: newX, y: newY, z: selfPos.z },
					...collisionContext,
				});
			}
		}
	}
}