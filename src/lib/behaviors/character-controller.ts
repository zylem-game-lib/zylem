import { EntityBehavior } from "./behavior";

export class ZylemCharacterController extends EntityBehavior {
	inputs: any; // TODO: this needs an interface!!!

	constructor(inputs: any) {
		super();
		this.inputs = inputs;
	}

}

export function CharacterController(inputs: any) {
	return new ZylemCharacterController(inputs);
}