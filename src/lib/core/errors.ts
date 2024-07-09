import { Mixin } from "ts-mixer";
import { GameEntity } from "./game-entity";

export class EntityErrors extends Mixin(GameEntity) {

	errorEntityBody(): string {
		const error = `body missing for entity ${this.name}`;
		console.warn(error);
		return error;
	}

	errorIncompatibleFileType(extension: string = 'unknown'): string {
		const error = `attempted to load data from a ${extension} file for entity ${this.name}, this file type is unsupported at the moment`;
		console.warn(error);
		return error;
	}
}