import {
	angleFromDirection2D,
	directionFromAngle2D,
	getRotationAngle2D,
	normalizeDirection2D,
} from '../../behaviors/shared/direction-2d';

export interface ResolvedAim2D {
	angle: number;
	direction: { x: number; y: number };
	hasAimInput: boolean;
}

export function getEntityFacingAngle2D(entity: any): number {
	if (entity.topDownMovementState) {
		return entity.topDownMovementState.facingAngle;
	}

	if (entity.body?.rotation) {
		return getRotationAngle2D(entity.body.rotation());
	}

	return entity._rotation2DAngle ?? 0;
}

export function resolveAim2D(
	aimX: number,
	aimY: number,
	fallbackAngle: number,
): ResolvedAim2D {
	const direction = normalizeDirection2D(aimX, aimY);
	if (direction) {
		return {
			angle: angleFromDirection2D(direction),
			direction,
			hasAimInput: true,
		};
	}

	return {
		angle: fallbackAngle,
		direction: directionFromAngle2D(fallbackAngle),
		hasAimInput: false,
	};
}
