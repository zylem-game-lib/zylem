import { InputProvider } from './input-provider';
import { AnalogState, ButtonState, InputPlayerNumber, Inputs } from './input';
import { GameInputConfig } from '../game/game-interfaces';
export declare class InputManager {
    private inputMap;
    private currentInputs;
    private previousInputs;
    constructor(config?: GameInputConfig);
    addInputProvider(playerNumber: InputPlayerNumber, provider: InputProvider): void;
    getInputs(delta: number): Inputs;
    mergeButtonState(a: ButtonState | undefined, b: ButtonState | undefined): ButtonState;
    mergeAnalogState(a: AnalogState | undefined, b: AnalogState | undefined): AnalogState;
    private mergeInputs;
}
//# sourceMappingURL=input-manager.d.ts.map