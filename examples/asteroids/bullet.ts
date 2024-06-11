import { Color, Vector2 } from "three";
import { sphere } from "../../src/lib/entities";

export function Bullet({ position = new Vector2(0, 0), velX = 0, velY = 0 }) {
	return sphere({
		name: `bullet`,
		radius: 0.1,
		color: new Color(Color.NAMES.gold),
		custom: {
			velX: 0,
			velY: 0,
			timer: 0,
			totalTime: 4
		},
		setup: ({ entity }) => {
			entity.setPosition(position.x, position.y, 1);
			// TODO: add proper type checking for Entity.custom
			(entity as any).velX = velX;
			(entity as any).velY = velY;
		},
		update: ({ delta, entity: bullet }) => {
			const { velX, velY } = bullet as any;
			bullet.moveXY(velX, velY);
			(bullet as any).timer += delta;
			if ((bullet as any).timer > (bullet as any).totalTime) {
				(bullet as any).destroy();
			}
		},
		collision: (bullet: any, other: any, globals: any) => {
			const { score } = globals;
			if (other.name === 'rock') {
				if (!other.hit && other.health > 0) {
					other.hit = true;
					score.set(score.get() + Math.abs(4 - other.health) * 25);
				}
				bullet.destroy();
			}
		}
	})
}