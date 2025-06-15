/** Input
 *
 * Maximum number of local players is 8.
 * All input can be mapped to a gamepad or keyboard but shares the common
 * interface represented as a gamepad.
 */
export type InputPlayerNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type InputPlayer = `p${InputPlayerNumber}`;
export interface ButtonState {
    pressed: boolean;
    released: boolean;
    held: number;
}
export interface AnalogState {
    value: number;
    held: number;
}
export interface InputGamepad {
    playerNumber: InputPlayerNumber;
    buttons: {
        A: ButtonState;
        B: ButtonState;
        X: ButtonState;
        Y: ButtonState;
        Start: ButtonState;
        Select: ButtonState;
        L: ButtonState;
        R: ButtonState;
    };
    directions: {
        Up: ButtonState;
        Down: ButtonState;
        Left: ButtonState;
        Right: ButtonState;
    };
    shoulders: {
        LTrigger: ButtonState;
        RTrigger: ButtonState;
    };
    axes: {
        Horizontal: AnalogState;
        Vertical: AnalogState;
    };
}
export type Inputs = Record<InputPlayer, InputGamepad>;
export type ButtonName = keyof InputGamepad['buttons'];
export type InputHandlerCallback = () => void;
export interface InputHandler {
    onPress(button: ButtonName, callback: InputHandlerCallback): void;
    update(currentInputs: Inputs): void;
}
