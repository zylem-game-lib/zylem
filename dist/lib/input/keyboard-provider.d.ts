import { InputProvider } from './input-provider';
import { InputGamepad } from './input';
export declare class KeyboardProvider implements InputProvider {
    private keyStates;
    private keyButtonStates;
    private mapping;
    private includeDefaultBase;
    constructor(mapping?: Record<string, string[]>, options?: {
        includeDefaultBase?: boolean;
    });
    private isKeyPressed;
    private handleButtonState;
    private handleAnalogState;
    private mergeButtonState;
    private applyCustomMapping;
    getInput(delta: number): Partial<InputGamepad>;
    getName(): string;
    private getAxisValue;
    isConnected(): boolean;
}
//# sourceMappingURL=keyboard-provider.d.ts.map