import { ControllerInput, GamePadConnections } from "../interfaces/GamePad";
import { JoystickManager } from 'nipplejs';
export default class GamePad {
    hasSupport: boolean;
    mobileGamepad?: JoystickManager | null;
    lastConnection: number;
    connections: GamePadConnections;
    keyboardInput: Map<string, boolean>;
    constructor();
    scanGamePads(): void;
    getInputAtIndex(index: number): ControllerInput;
    getInputs(): ControllerInput[];
    getDebugInfo(): string;
}
