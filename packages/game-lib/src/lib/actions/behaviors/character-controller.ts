
export class ZylemCharacterController {
	inputs: any; // TODO: this needs an interface!!!

	constructor(inputs: any) {
		this.inputs = inputs;
	}

}

export function CharacterController(inputs: any) {
	return new ZylemCharacterController(inputs);
}