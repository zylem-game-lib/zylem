import { Color, Vector3 } from 'three';
import { Box } from "../../src/lib/entities";

export function Brick(posX, posY) {
	return Box({
		name: `brick`,
		color: new Color('#F30'),
		custom: {
			health: 2
		},
		size: new Vector3(2, 0.5, 1),
		setup: ({ entity }) => {
			entity.setPosition(posX, posY, 0);
		},
		update: ({ entity: brick }) => {
			if ((brick as any).health === 1) {
				brick.setColor(new Color('#ff0'));
			}
		},
		collision: (brick, other, globals) => {
			if (brick.health === 0) {
				// TODO: params should be available without explicitly passing
				brick.destroy({ globals });
			}
		},
		destroy: ({ globals }) => {
			const { bricks, score } = globals;
			const brickCount = bricks.get() - 1;
			bricks.set(brickCount);
			const newScore = score.get() + 100;
			score.set(newScore);
		}
	})
}