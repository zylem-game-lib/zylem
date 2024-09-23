import { Mixin } from "ts-mixer";
import { StageEntity  } from "../core";
import { EntityErrors } from "../core/errors";
import { OptionalVector } from "../interfaces/entity";
import { Moveable } from "./moveable";
import { Vector3 } from "three";

export class EntitySpawner extends Mixin(StageEntity, EntityErrors, Moveable) {
	spawn(T: any, options: any) {
		const stage = this.stageRef;
		stage?.spawnEntity(T(options));
	}

	spawnRelative(T: any, options: any, offset: OptionalVector) {
		// TODO: determine switch for 2D/3D implementation (strategy?)
		this.spawnRelative2d(T, options, offset);
	}

	spawnRelative2d(T: any, options: any, offset: OptionalVector) {
		const stage = this.stageRef;
		if (!this.body) {
			this.errorEntityBody();
			return;
		}
		const { x, y, z } = this.body.translation();
		const rz = this._rotation2DAngle;
		const offsetX = Math.sin(-rz) * (offset.x ?? 0);
		const offsetY = Math.cos(-rz) * (offset.y ?? 0);
		options.position = new Vector3(x + offsetX, y + offsetY, z + (offset.z ?? 0));
		stage?.spawnEntity(T(options));
	}
}