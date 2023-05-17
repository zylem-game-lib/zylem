export type GamePadConnections = Map<number, boolean>;

export interface ControllerInput {
	horizontal: number;
	vertical: number;
	buttonA: number;
	buttonB: number;
	buttonX: number;
	buttonY: number;
	buttonSelect: number;
	buttonStart: number;

	moveUp: number;
	moveDown: number;
}
