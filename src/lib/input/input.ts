/** Input
 * 
 * Maximum number of local players is 8.
 * All input can be mapped to a gamepad or keyboard but shares the common
 * interface represented as a gamepad.
 */

export type InputPlayerNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type InputPlayer = `p${InputPlayerNumber}`;

export interface ButtonState {
	pressed: boolean;   // True only on the first frame when pressed
	released: boolean;  // True only on the first frame when released
	held: number;      // Time in seconds the button has been held
}

export interface InputGamepad {
	playerNumber: InputPlayerNumber;
	buttons: {
		A: ButtonState;  // Full button state tracking
		B: boolean;      // Simple pressed state
		X: boolean;
		Y: boolean;
		Start: boolean;
		Select: boolean;
		L: boolean;
		R: boolean;
	};
	directions: {
		Up: boolean;
		Down: boolean;
		Left: boolean;
		Right: boolean;
	};
	shoulders: {
		LTrigger: number;
		RTrigger: number;
	};
	axes: {
		Horizontal: number;
		Vertical: number;
	};
}

export type Inputs = Record<InputPlayer, InputGamepad>;

export type ButtonName = keyof InputGamepad['buttons'];
export type InputHandlerCallback = () => void;

export interface InputHandler {
	onPress(button: ButtonName, callback: InputHandlerCallback): void;
	update(currentInputs: Inputs): void;
}
