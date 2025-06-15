import { InputProvider } from './input-provider';
import { InputGamepad } from './input';
export declare class KeyboardProvider implements InputProvider {
    private keyStates;
    private keyButtonStates;
    constructor();
    private isKeyPressed;
    private handleButtonState;
    private handleAnalogState;
    getInput(delta: number): Partial<InputGamepad>;
    getName(): string;
    private getAxisValue;
    isConnected(): boolean;
}
