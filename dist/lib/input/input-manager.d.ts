import { InputProvider } from './input-provider';
import { AnalogState, ButtonState, InputPlayerNumber, Inputs } from './input';
export declare class InputManager {
    private inputMap;
    private currentInputs;
    private previousInputs;
    constructor();
    addInputProvider(playerNumber: InputPlayerNumber, provider: InputProvider): void;
    getInputs(delta: number): Inputs;
    mergeButtonState(a: ButtonState | undefined, b: ButtonState | undefined): ButtonState;
    mergeAnalogState(a: AnalogState | undefined, b: AnalogState | undefined): AnalogState;
    private mergeInputs;
}
