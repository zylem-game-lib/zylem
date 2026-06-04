export interface Shooter2DStateComponent {
	cooldownRemainingMs: number;
}

export function createShooter2DStateComponent(): Shooter2DStateComponent {
	return {
		cooldownRemainingMs: 0,
	};
}
