import { Mixin } from "ts-mixer";
import { GameEntity } from "./game-entity";

export class EntityErrors extends Mixin(GameEntity) {

	errorEntityBody() {
		console.warn(`body missing for entity ${this.name}`);
	}
}