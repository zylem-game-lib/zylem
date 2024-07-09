import { Color, Vector3 } from "three";
import { PerspectiveType } from "./perspective";
import { Conditions, GameBlueprint, SetupCallback } from "./game";
import { UpdateFunction } from "./entity";
export interface StageBlueprint {
    id?: string;
    gravity?: Vector3;
    perspective: PerspectiveType;
    backgroundImage?: string;
    backgroundColor: Color | number;
    setup: SetupCallback;
    children: (globals?: any) => any[];
    conditions: Array<Conditions<GameBlueprint["globals"]>>;
    update?: UpdateFunction<any> | null;
}
