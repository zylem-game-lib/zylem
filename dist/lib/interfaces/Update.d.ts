import { ControllerInput } from "./GamePad";
export interface UpdateOptions<T> {
    inputs: ControllerInput[];
    entity: T;
    globals: any;
}
