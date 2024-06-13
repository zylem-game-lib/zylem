import { Vector2 } from "three";
import { Zylem, THREE, stage, Perspectives } from "../../src/main";
import { Coin } from "./game-objects/coin";
import { Goal } from "./game-objects/goal";
import { Ground } from "./ground";
import { Player } from "./player";
import { settings } from "./settings";
const { Color, Vector3 } = THREE;
const { ThirdPerson } = Perspectives;
const { groundLevel } = settings;

export function LevelOne() {
	return stage({
		perspective: ThirdPerson,
		gravity: new Vector3(0, -10, 0),
		backgroundColor: new Color(0xA1ADFF),
		conditions: [
			{
				bindings: ['score', 'lives'],
				callback: (globals, game) => {
					const { lives } = globals;
					if (lives.get() <= 0) {
						game.reset();
					}
				}
			}
		],
		setup: ({ HUD, camera, entity: stage }) => {
			camera.moveCamera(new Vector3(0, 8, 20));
			HUD.addText('0', {
				binding: 'score',
				update: (element, value) => {
					element.text = `Score: ${value}`;
				},
				position: new Vector2(50, 5)
			});
			HUD.addText('0', {
				binding: 'time',
				update: (element, value) => {
					element.text = `Time: ${value}`;
				},
				position: new Vector2(25, 5)
			});
		},
		children: () => {
			const coins: any[] = [];
			for (let i = 28; i < 70; i += 2) {
				const coin = Coin({ position: new Vector3(i, groundLevel - 3, 0) });
				coins.push(coin);
			}
			return [
				Player(),
				...coins,
				Ground({ position: new Vector3(0, groundLevel, 0), rotation: new Vector3(0, 0, 0) }),
				Ground({ position: new Vector3(51, groundLevel - 6, 0), rotation: new Vector3(0, 0, 0) }),
				Ground({ position: new Vector3(-30, groundLevel + 2, 0), rotation: new Vector3(0, 0, 0) }),
				Goal()
			];
		},
		update: ({ delta, camera, entity, globals }) => {
			if (!camera.target) {
				const player = entity.getEntityByName('player');
				if (player) {
					camera.target = player;
				}
			}
			const { actualTime, time } = globals;
			actualTime.set(actualTime.get() + delta);
			time.set(Math.round(actualTime.get()));
		}
	})
};