import { Color, Vector3 } from "three";
import { PerspectiveType } from "./perspective";
import { Conditions, SetupCallback } from "./game";
import { GameOptions } from "../core/";
import { UpdateFunction } from "./entity";
export interface StageBlueprint {
    id?: string;
    gravity?: Vector3;
    perspective: PerspectiveType;
    backgroundImage?: string;
    backgroundColor: Color | number;
    setup: SetupCallback;
    children: (globals?: any) => any[];
    conditions: Array<Conditions<GameOptions["globals"]>>;
    update?: UpdateFunction<any> | null;
}
