import { ControllerInput } from "./game-pad";
export interface UpdateOptions<T> {
    inputs: ControllerInput[];
    entity: T;
    globals: any;
}
