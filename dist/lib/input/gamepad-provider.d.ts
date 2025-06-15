import { InputProvider } from './input-provider';
import { InputGamepad } from './input';
export declare class GamepadProvider implements InputProvider {
    private gamepadIndex;
    private connected;
    private buttonStates;
    constructor(gamepadIndex: number);
    private handleButtonState;
    private handleAnalogState;
    getInput(delta: number): Partial<InputGamepad>;
    getName(): string;
    isConnected(): boolean;
}
