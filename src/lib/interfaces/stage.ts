import { Color, Vector3 } from "three";
import { PerspectiveType } from "./perspective";
import { Conditions, SetupCallback } from "./game";
import { GameOptions } from "../core/";
import { LifecycleFunction } from "./entity";

export interface StageBlueprint<T = any> {
	id?: string;
	gravity?: Vector3;
	perspective: PerspectiveType;
	backgroundImage?: string;
	backgroundColor: Color | number;
	setup: SetupCallback;
	children: (globals?: any) => any[];
	_childrenMap?: Map<number, any>;
	conditions: Array<Conditions<GameOptions["globals"]>>;
	update?: LifecycleFunction<T> | null;
}