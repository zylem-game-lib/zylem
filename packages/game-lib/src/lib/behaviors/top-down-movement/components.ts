export interface TopDownMovementComponent {
	moveSpeed: number;
}

export function createTopDownMovementComponent(
	options: Partial<TopDownMovementComponent> = {},
): TopDownMovementComponent {
	return {
		moveSpeed: options.moveSpeed ?? 8,
	};
}

export interface TopDownMovementInputComponent {
	moveX: number;
	moveY: number;
	faceX: number;
	faceY: number;
}

export function createTopDownMovementInputComponent(): TopDownMovementInputComponent {
	return {
		moveX: 0,
		moveY: 0,
		faceX: 0,
		faceY: 0,
	};
}

export interface TopDownMovementStateComponent {
	facingAngle: number;
	moving: boolean;
}

export function createTopDownMovementStateComponent(): TopDownMovementStateComponent {
	return {
		facingAngle: 0,
		moving: false,
	};
}
